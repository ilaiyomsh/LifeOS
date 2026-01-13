import React, { useState, useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { useSettings } from '../../contexts/SettingsContext';
import { DOMAINS, EVENT_TYPES } from '../../lib/constants';
import { optimizeScheduleWithAI } from '../../lib/ai';
import { generateSchedule } from '../../lib/scheduler';
import { Sun, Sparkles, Loader2, Plus, Clock, X, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const addMinutesToTime = (timeStr, minutesToAdd) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const ScheduleFeature = () => {
    const { tasks, updateTask, addTask, getHardEvents, getTasksForScheduling } = useTasks();
    const { settings } = useSettings();

    const [startTime, setStartTime] = useState('08:00');
    const [isOptimizing, setIsOptimizing] = useState(false);
    const [isScheduling, setIsScheduling] = useState(false);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [newEventText, setNewEventText] = useState('');
    const [eventStartTime, setEventStartTime] = useState('09:00');
    const [eventEndTime, setEventEndTime] = useState('10:00');
    const [eventType, setEventType] = useState('other');
    const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
    const [scheduledBlocks, setScheduledBlocks] = useState([]);
    const [unscheduledTasks, setUnscheduledTasks] = useState([]);
    const [scheduleError, setScheduleError] = useState(null);

    const todaysTasks = useMemo(() => {
        return getTasksForScheduling();
    }, [tasks, getTasksForScheduling]);

    const hardEvents = useMemo(() => {
        return getHardEvents();
    }, [tasks, getHardEvents]);

    // Group scheduled blocks by date
    const scheduleByDate = useMemo(() => {
        const grouped = {};
        scheduledBlocks.forEach(block => {
            if (!grouped[block.date]) {
                grouped[block.date] = [];
            }
            grouped[block.date].push(block);
        });
        return grouped;
    }, [scheduledBlocks]);

    // Get today's schedule items
    const todayStr = new Date().toISOString().split('T')[0];
    const scheduleItems = useMemo(() => {
        const todayBlocks = scheduleByDate[todayStr] || [];
        return todayBlocks
            .sort((a, b) => {
                const timeA = a.start.split(':').map(Number);
                const timeB = b.start.split(':').map(Number);
                return (timeA[0] * 60 + timeA[1]) - (timeB[0] * 60 + timeB[1]);
            })
            .map(block => {
                const task = tasks.find(t => t.id === block.taskId);
                if (!task) return null;
                return {
                    ...task,
                    start: block.start,
                    end: block.end,
                    duration: block.duration
                };
            })
            .filter(Boolean);
    }, [scheduleByDate, todayStr, tasks]);

    const handleSmartSchedule = () => {
        setIsScheduling(true);
        setScheduleError(null);

        try {
            const today = new Date();
            const endDate = new Date(today);
            endDate.setDate(endDate.getDate() + 7); // Schedule for 7 days ahead

            const scheduleResult = generateSchedule(
                tasks,
                settings,
                hardEvents,
                today,
                endDate
            );

            // Update tasks with scheduled blocks
            const taskBlocks = {};
            scheduleResult.forEach(block => {
                if (!taskBlocks[block.taskId]) {
                    taskBlocks[block.taskId] = [];
                }
                taskBlocks[block.taskId].push(block);
            });

            // Update each task with its scheduled blocks
            Object.keys(taskBlocks).forEach(taskId => {
                updateTask(Number(taskId), {
                    scheduledBlocks: taskBlocks[taskId]
                });
            });

            setScheduledBlocks(scheduleResult);

            // Find unscheduled tasks
            const scheduledTaskIds = new Set(scheduleResult.map(b => b.taskId));
            const unscheduled = todaysTasks.filter(t => !scheduledTaskIds.has(t.id));
            setUnscheduledTasks(unscheduled);

            if (unscheduled.length > 0) {
                setScheduleError(`לא ניתן היה לתזמן ${unscheduled.length} משימות. ייתכן שאין מספיק זמן זמין.`);
            }

        } catch (e) {
            console.error("Scheduling failed", e);
            setScheduleError(e.message || "התזמון נכשל. אנא בדוק את ההגדרות.");
        } finally {
            setIsScheduling(false);
        }
    };

    const handleAiOptimize = async () => {
        setIsOptimizing(true);

        try {
            const orderIds = await optimizeScheduleWithAI(todaysTasks, startTime);

            // Update tasks order
            orderIds.forEach((id, index) => {
                updateTask(id, { scheduleOrder: index });
            });

        } catch (e) {
            console.error("Optimize failed", e);
            alert(e.message || "האופטימיזציה נכשלה");
        } finally {
            setIsOptimizing(false);
        }
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEventText.trim()) return;

        const payload = {
            text: newEventText,
            type: 'event',
            eventType: eventType,
            startTime: eventStartTime,
            endTime: eventEndTime,
            time: eventStartTime, // Keep for backward compatibility
            deadline: eventDate,
            domain: 'work', // Default
            importance: 3,
            urgency: 3
        };

        addTask(payload);
        setNewEventText('');
        setIsAddingEvent(false);
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                            <Sun className="text-orange-500" size={18} /> לוח זמנים יומי
                        </h2>
                        <p className="text-[10px] text-slate-500">תוכנית מותאמת להיום</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500">התחלה:</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            aria-label="שעת התחלה"
                            className="bg-transparent text-sm font-mono font-bold text-slate-800 outline-none w-16 focus:ring-2 focus:ring-blue-400 rounded"
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleSmartSchedule}
                        disabled={isScheduling}
                        aria-label="תזמון חכם"
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isScheduling ? <Loader2 size={14} className="animate-spin" /> : <Sun size={14} />}
                        תזמון חכם
                    </button>
                    <button
                        onClick={handleAiOptimize}
                        disabled={isOptimizing}
                        aria-label="אופטימיזציה אוטומטית עם AI"
                        className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2 disabled:opacity-50"
                    >
                        {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                        שיפור AI
                    </button>
                    <button
                        onClick={() => setIsAddingEvent(!isAddingEvent)}
                        aria-label="הוסף אירוע"
                        className={cn(
                            "px-3 py-2 rounded-lg text-xs font-bold transition-all focus:outline-none focus:ring-2 focus:ring-blue-400",
                            isAddingEvent 
                                ? "bg-blue-600 text-white" 
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                        )}
                    >
                        <Plus size={14} />
                    </button>
                </div>

                {isAddingEvent && (
                    <form onSubmit={handleAddEvent} className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2 animate-in slide-in-from-top-2">
                        <div className="flex justify-between items-center">
                            <h3 className="text-xs font-bold text-blue-900">הוסף אירוע</h3>
                            <button
                                type="button"
                                onClick={() => setIsAddingEvent(false)}
                                aria-label="סגור"
                                className="text-blue-400 hover:text-blue-600"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <input
                            value={newEventText}
                            onChange={e => setNewEventText(e.target.value)}
                            placeholder="שם האירוע..."
                            className="w-full text-sm px-3 py-2 rounded-lg border border-blue-200 focus:border-blue-400 outline-none bg-white"
                            autoFocus
                        />
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-700 block">תאריך</label>
                                <input
                                    type="date"
                                    value={eventDate}
                                    onChange={e => setEventDate(e.target.value)}
                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 outline-none bg-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-700 block">סוג</label>
                                <select
                                    value={eventType}
                                    onChange={e => setEventType(e.target.value)}
                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 outline-none bg-white"
                                >
                                    {Object.entries(EVENT_TYPES).map(([key, eventType]) => (
                                        <option key={key} value={key}>{eventType.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-700 block">התחלה</label>
                                <input
                                    type="time"
                                    value={eventStartTime}
                                    onChange={e => setEventStartTime(e.target.value)}
                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 outline-none bg-white font-mono"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-blue-700 block">סיום</label>
                                <input
                                    type="time"
                                    value={eventEndTime}
                                    onChange={e => setEventEndTime(e.target.value)}
                                    className="w-full text-xs px-2 py-1.5 rounded-lg border border-blue-200 focus:border-blue-400 outline-none bg-white font-mono"
                                />
                            </div>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                        >
                            הוסף אירוע
                        </button>
                    </form>
                )}
            </div>

            {scheduleError && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800">{scheduleError}</p>
                </div>
            )}

            {unscheduledTasks.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h3 className="text-xs font-bold text-red-800 mb-2 flex items-center gap-2">
                        <AlertCircle size={14} /> משימות שלא נכנסו ({unscheduledTasks.length})
                    </h3>
                    <div className="space-y-1">
                        {unscheduledTasks.map(task => (
                            <div key={task.id} className="text-xs text-red-700">
                                • {task.text}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 relative pb-4">
                <div className="absolute top-0 bottom-0 right-[19px] w-0.5 bg-slate-200 z-0"></div>

                {scheduleItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Sun size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">אין משימות מתוזמנות להיום.</p>
                        <p className="text-xs text-slate-400 mt-2">לחץ על "תזמון חכם" כדי ליצור תזמון אוטומטי</p>
                    </div>
                ) : scheduleItems.map((item) => (
                    <div key={item.id} className="relative z-10 flex gap-3 group animate-fadeIn">
                        <div className="flex flex-col items-center min-w-[40px] pt-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1 rounded">{item.start}</span>
                        </div>

                        <div className={`flex-grow p-3 rounded-xl border-l-4 shadow-sm bg-white mb-1 ${DOMAINS[item.domain]?.border ? DOMAINS[item.domain].border.replace('border-', 'border-l-') : 'border-l-slate-200'} active:scale-[0.99] transition-transform`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${DOMAINS[item.domain]?.bgLight} ${DOMAINS[item.domain]?.text} font-bold`}>
                                        {DOMAINS[item.domain]?.label}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-sm mt-1 line-clamp-1">{item.text}</h3>
                                </div>
                                <div className="text-right min-w-[50px]">
                                    <span className="text-[10px] text-slate-400 block font-mono">{item.duration || 60}ד</span>
                                    <span className="text-[9px] text-slate-300 block mt-0.5">עד {item.end}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
