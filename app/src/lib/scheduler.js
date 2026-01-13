// ==========================================
// CONSTANTS
// ==========================================
const WEIGHT_IMPORTANCE = 1.5;
const WEIGHT_URGENCY = 1.0;
const DEADLINE_CRITICAL_BONUS = 10;
const DEADLINE_THRESHOLD_DAYS = 3;
const MIN_BLOCK_DURATION = 30; // minutes
const MAX_BLOCK_DURATION = 120; // minutes
const PRESSURE_CRITICAL = 0.9;
const PRESSURE_HIGH = 0.6;
const PRESSURE_MEDIUM = 0.3;

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const [hours, mins] = timeStr.split(':').map(Number);
    return hours * 60 + mins;
};

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export const minutesToTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

/**
 * Add minutes to a time string
 */
export const addMinutesToTime = (timeStr, minutesToAdd) => {
    const totalMinutes = timeToMinutes(timeStr) + minutesToAdd;
    return minutesToTime(totalMinutes);
};

/**
 * Calculate total available capacity between two dates
 * Takes into account work hours and hard events (meetings, etc.)
 */
export const getTotalCapacitySnapshot = (startDate, endDate, settings, hardEvents = []) => {
    let totalMinutes = 0;
    const currentCheck = new Date(startDate);
    const end = new Date(endDate);

    while (currentCheck <= end) {
        const dayIndex = currentCheck.getDay(); // 0 = Sunday, 6 = Saturday
        const dayConfig = settings.workHours && settings.workHours[dayIndex] ? settings.workHours[dayIndex] : null;

        if (dayConfig && !dayConfig.isOff && Array.isArray(dayConfig.blocks) && dayConfig.blocks.length > 0) {
            const dateStr = currentCheck.toISOString().split('T')[0];

            for (const block of dayConfig.blocks) {
                const blockStart = timeToMinutes(block.start);
                const blockEnd = timeToMinutes(block.end);
                let windowSize = blockEnd - blockStart;

                // Subtract hard events that fall in this window
                const conflicts = hardEvents.filter(event => {
                    if (!event.deadline || event.deadline !== dateStr) return false;
                    if (!event.startTime || !event.endTime) return false;
                    
                    const eventStart = timeToMinutes(event.startTime);
                    const eventEnd = timeToMinutes(event.endTime);
                    
                    // Check if event overlaps with block
                    return !(eventEnd <= blockStart || eventStart >= blockEnd);
                });

                let busyTime = 0;
                for (const conflict of conflicts) {
                    const eventStart = timeToMinutes(conflict.startTime);
                    const eventEnd = timeToMinutes(conflict.endTime);
                    const overlapStart = Math.max(blockStart, eventStart);
                    const overlapEnd = Math.min(blockEnd, eventEnd);
                    busyTime += Math.max(0, overlapEnd - overlapStart);
                }

                totalMinutes += Math.max(0, windowSize - busyTime);
            }
        }

        currentCheck.setDate(currentCheck.getDate() + 1);
    }

    return totalMinutes;
};

/**
 * Calculate urgency score based on pressure (task duration vs available capacity)
 */
export const calculatePressureScore = (taskDuration, availableCapacity) => {
    if (availableCapacity === 0) return 5; // No time at all -> emergency

    const ratio = taskDuration / availableCapacity;

    if (ratio >= PRESSURE_CRITICAL) return 5;
    if (ratio >= PRESSURE_HIGH) return 4;
    if (ratio >= PRESSURE_MEDIUM) return 3;
    if (ratio >= 0.1) return 2;
    return 1;
};

/**
 * Check if there's a collision with a hard event at a specific date and time
 */
export const checkCollision = (hardEvents, date, time) => {
    const dateStr = typeof date === 'string' ? date : date.toISOString().split('T')[0];
    const timeMinutes = timeToMinutes(time);

    return hardEvents.find(event => {
        if (!event.deadline || event.deadline !== dateStr) return false;
        if (!event.startTime || !event.endTime) return false;

        const eventStart = timeToMinutes(event.startTime);
        const eventEnd = timeToMinutes(event.endTime);

        return timeMinutes >= eventStart && timeMinutes < eventEnd;
    });
};

/**
 * Find a short task that fits in the available duration
 */
export const findShortTask = (tasks, maxDuration) => {
    return tasks.find(task => {
        const duration = task.duration || 60;
        return duration <= maxDuration && duration >= MIN_BLOCK_DURATION;
    });
};

/**
 * Calculate days difference between two dates
 */
const dateDiff = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d1 - d2;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Get day of week index (0 = Sunday, 6 = Saturday)
 */
const getDayOfWeek = (date) => {
    return new Date(date).getDay();
};

// ==========================================
// MAIN SCHEDULING FUNCTION
// ==========================================

/**
 * Generate a smart schedule for tasks based on the algorithm
 * @param {Array} tasks - Array of task objects
 * @param {Object} settings - Settings object with workHours
 * @param {Array} hardEvents - Array of hard events (type === 'event')
 * @param {Date|string} startDate - Start date for scheduling
 * @param {Date|string} endDate - End date for scheduling (default: 30 days from start)
 * @returns {Array} Array of scheduled blocks: [{taskId, date, start, end, duration}]
 */
export const generateSchedule = (tasks, settings, hardEvents = [], startDate, endDate = null) => {
    // Validation
    if (!tasks || !Array.isArray(tasks)) {
        throw new Error('Tasks must be an array');
    }
    if (!settings || !settings.workHours) {
        throw new Error('Settings must include workHours');
    }

    const today = new Date(startDate);
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    const end = endDate ? new Date(endDate) : new Date(today);
    if (!endDate) {
        end.setDate(end.getDate() + 30); // Default: 30 days ahead
    }
    end.setHours(23, 59, 59, 999); // Normalize to end of day

    // Phase 1: Filter and initialize
    const openTasks = tasks
        .filter(t => !t.completedAt && t.type !== 'event')
        .map(task => ({
            ...task,
            remainingTime: task.duration || 60
        }));

    if (openTasks.length === 0) {
        return [];
    }

    // Phase 2: Calculate smart scores
    const todayStr = today.toISOString().split('T')[0];
    
    for (const task of openTasks) {
        // Calculate capacity until deadline
        const deadline = task.deadline ? new Date(task.deadline) : new Date(end);
        const capacityUntilDeadline = getTotalCapacitySnapshot(
            today,
            deadline,
            settings,
            hardEvents
        );

        // Calculate objective urgency based on pressure
        const calculatedUrgency = calculatePressureScore(
            task.remainingTime,
            capacityUntilDeadline
        );

        // Final urgency is the maximum of user-set and calculated
        const finalUrgency = Math.max(task.urgency || 3, calculatedUrgency);

        // Calculate weighted score
        task.score = (task.importance || 3) * WEIGHT_IMPORTANCE + finalUrgency * WEIGHT_URGENCY;

        // Bonus for critical deadline
        if (task.deadline) {
            const daysLeft = dateDiff(task.deadline, todayStr);
            if (daysLeft <= DEADLINE_THRESHOLD_DAYS) {
                task.score += DEADLINE_CRITICAL_BONUS;
            }
        }

        // Store calculated urgency for reference
        task.calculatedUrgency = calculatedUrgency;
    }

    // Sort by score (highest first)
    openTasks.sort((a, b) => b.score - a.score);

    // Phase 3: Scheduling loop (Front-Loading strategy)
    const generatedSchedule = [];
    const currentDate = new Date(today);

    while (
        openTasks.some(t => t.remainingTime > 0) &&
        currentDate <= end
    ) {
        const dayIndex = getDayOfWeek(currentDate);
        const dayConfig = settings.workHours && settings.workHours[dayIndex] ? settings.workHours[dayIndex] : null;
        const dateStr = currentDate.toISOString().split('T')[0];

        if (dayConfig && !dayConfig.isOff && Array.isArray(dayConfig.blocks) && dayConfig.blocks.length > 0) {
            // Process each time window in the day
            for (const timeWindow of dayConfig.blocks) {
                let currentTime = timeToMinutes(timeWindow.start);
                const windowEndTime = timeToMinutes(timeWindow.end);

                // Fill the window (Tetris-style)
                while ((windowEndTime - currentTime) >= MIN_BLOCK_DURATION) {
                    // Find the best task that hasn't been completed
                    const bestTask = openTasks.find(
                        t => t.remainingTime > 0 && (!t.deadline || t.deadline >= dateStr)
                    );

                    if (!bestTask) {
                        break; // No more tasks, move to next window
                    }

                    // Check for collision with hard event
                    const currentTimeStr = minutesToTime(currentTime);
                    const hardEvent = checkCollision(hardEvents, dateStr, currentTimeStr);
                    
                    if (hardEvent) {
                        // Skip over the event
                        currentTime = timeToMinutes(hardEvent.endTime);
                        continue;
                    }

                    // Calculate block size
                    const allocatedMinutes = Math.min(
                        bestTask.remainingTime,
                        windowEndTime - currentTime,
                        MAX_BLOCK_DURATION
                    );

                    // Check if block is too small
                    if (allocatedMinutes < MIN_BLOCK_DURATION) {
                        // Try to find a shorter task that fits
                        const alternativeTask = findShortTask(openTasks, allocatedMinutes);
                        if (alternativeTask) {
                            // Use alternative task
                            const altAllocated = Math.min(
                                alternativeTask.remainingTime,
                                windowEndTime - currentTime,
                                MAX_BLOCK_DURATION
                            );
                            
                            if (altAllocated >= MIN_BLOCK_DURATION) {
                                const newBlock = {
                                    taskId: alternativeTask.id,
                                    date: dateStr,
                                    start: minutesToTime(currentTime),
                                    end: minutesToTime(currentTime + altAllocated),
                                    duration: altAllocated
                                };
                                generatedSchedule.push(newBlock);
                                alternativeTask.remainingTime -= altAllocated;
                                currentTime += altAllocated;
                                continue;
                            }
                        }
                        break; // Can't fit anything, close the window
                    }

                    // Create the scheduled block
                    const newBlock = {
                        taskId: bestTask.id,
                        date: dateStr,
                        start: minutesToTime(currentTime),
                        end: minutesToTime(currentTime + allocatedMinutes),
                        duration: allocatedMinutes
                    };

                    generatedSchedule.push(newBlock);

                    // Update counters
                    bestTask.remainingTime -= allocatedMinutes;
                    currentTime += allocatedMinutes;
                }
            }
        }

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
    }

    return generatedSchedule;
};

