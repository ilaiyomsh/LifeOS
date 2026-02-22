// LocalStorage-backed database for offline use (no Supabase required)

function generateId() {
  return crypto.randomUUID();
}

// --- In-memory cache ---
const cache = {};

function getStore(table) {
  if (cache[table]) return cache[table];
  try {
    const data = JSON.parse(localStorage.getItem(`lifeos_${table}`) || '[]');
    cache[table] = data;
    return data;
  } catch {
    return [];
  }
}

function setStore(table, data) {
  cache[table] = data;
  localStorage.setItem(`lifeos_${table}`, JSON.stringify(data));
}

// --- Event emitter for cross-hook reactivity ---
const listeners = {};

function emit(table) {
  (listeners[table] || []).forEach((fn) => fn());
}

export function subscribe(table, fn) {
  if (!listeners[table]) listeners[table] = [];
  listeners[table].push(fn);
  return () => {
    listeners[table] = listeners[table].filter((f) => f !== fn);
  };
}

// --- Tasks ---

export function getTasks(filters = {}) {
  let rows = [...getStore('tasks')];

  // Never show trashed by default
  rows = rows.filter((r) => r.status !== 'trashed');

  if (filters.status) {
    const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
    rows = rows.filter((r) => statuses.includes(r.status));
  }
  if (filters.area) rows = rows.filter((r) => r.area === filters.area);
  if (filters.project_id) rows = rows.filter((r) => r.project_id === filters.project_id);
  if (filters.scheduled_date) rows = rows.filter((r) => r.scheduled_date === filters.scheduled_date);

  // Sort: position asc, then created_at desc
  rows.sort((a, b) => {
    const posDiff = (a.position || 0) - (b.position || 0);
    if (posDiff !== 0) return posDiff;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return rows;
}

export function searchTasks(query) {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const rows = getStore('tasks').filter((r) => r.status !== 'trashed');
  return rows.filter((r) =>
    (r.title && r.title.toLowerCase().includes(q)) ||
    (r.notes && r.notes.toLowerCase().includes(q)) ||
    (r.waiting_on && r.waiting_on.toLowerCase().includes(q))
  );
}

export function addTask(taskData) {
  const rows = getStore('tasks');
  const task = {
    id: generateId(),
    title: taskData.title || '',
    notes: taskData.notes || null,
    status: taskData.status || 'inbox',
    priority: taskData.priority || null,
    area: taskData.area || null,
    project_id: taskData.project_id || null,
    due_date: taskData.due_date || null,
    scheduled_date: taskData.scheduled_date || null,
    estimated_minutes: taskData.estimated_minutes || null,
    waiting_on: taskData.waiting_on || null,
    is_focus: taskData.is_focus || false,
    tags: taskData.tags || [],
    recurring_rule: taskData.recurring_rule || null,
    created_at: new Date().toISOString(),
    completed_at: null,
    updated_at: new Date().toISOString(),
    position: taskData.position || 0,
  };
  rows.push(task);
  setStore('tasks', rows);
  emit('tasks');
  return task;
}

export function updateTask(id, updates) {
  const rows = getStore('tasks');
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Task not found');

  rows[idx] = { ...rows[idx], ...updates, updated_at: new Date().toISOString() };
  setStore('tasks', rows);
  emit('tasks');
  return rows[idx];
}

export function deleteTask(id) {
  const rows = getStore('tasks');
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Task not found');

  rows[idx] = { ...rows[idx], status: 'trashed', updated_at: new Date().toISOString() };
  setStore('tasks', rows);
  emit('tasks');
}

// --- Projects ---

export function getProjects(filters = {}) {
  let rows = [...getStore('projects')];

  if (filters.area) rows = rows.filter((r) => r.area === filters.area);
  if (filters.is_active !== undefined) rows = rows.filter((r) => r.is_active === filters.is_active);

  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows;
}

export function addProject(projectData) {
  const rows = getStore('projects');
  const project = {
    id: generateId(),
    title: projectData.title || '',
    area: projectData.area,
    description: projectData.description || null,
    is_active: projectData.is_active !== undefined ? projectData.is_active : true,
    created_at: new Date().toISOString(),
    completed_at: null,
  };
  rows.push(project);
  setStore('projects', rows);
  emit('projects');
  return project;
}

export function updateProject(id, updates) {
  const rows = getStore('projects');
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Project not found');

  if (updates.is_active === false && !updates.completed_at) {
    updates.completed_at = new Date().toISOString();
  }
  rows[idx] = { ...rows[idx], ...updates };
  setStore('projects', rows);
  emit('projects');
  return rows[idx];
}

// --- Events ---

export function getEvents(from, to) {
  let rows = [...getStore('events')];

  if (from) rows = rows.filter((r) => r.start_at >= from);
  if (to) rows = rows.filter((r) => r.start_at <= to);

  rows.sort((a, b) => new Date(a.start_at) - new Date(b.start_at));
  return rows;
}

export function addEvent(eventData) {
  const rows = getStore('events');
  const event = {
    id: generateId(),
    title: eventData.title || '',
    area: eventData.area || null,
    start_at: eventData.start_at,
    end_at: eventData.end_at || null,
    is_all_day: eventData.is_all_day || false,
    notes: eventData.notes || null,
    created_at: new Date().toISOString(),
  };
  rows.push(event);
  setStore('events', rows);
  emit('events');
  return event;
}

export function updateEvent(id, updates) {
  const rows = getStore('events');
  const idx = rows.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error('Event not found');

  rows[idx] = { ...rows[idx], ...updates };
  setStore('events', rows);
  emit('events');
  return rows[idx];
}

export function deleteEvent(id) {
  const rows = getStore('events');
  const updated = rows.filter((r) => r.id !== id);
  setStore('events', updated);
  emit('events');
}

// --- Habits ---

export function getHabits() {
  return getStore('habits').filter((h) => h.is_active !== false);
}

export function addHabit(habitData) {
  const rows = getStore('habits');
  const habit = {
    id: generateId(),
    title: habitData.title || '',
    area: habitData.area || null,
    frequency: habitData.frequency || 'daily',
    color: habitData.color || 'blue',
    is_active: true,
    created_at: new Date().toISOString(),
  };
  rows.push(habit);
  setStore('habits', rows);
  emit('habits');
  return habit;
}

export function deleteHabit(id) {
  const rows = getStore('habits');
  setStore('habits', rows.filter((r) => r.id !== id));
  // Also delete logs
  const logs = getStore('habit_logs');
  setStore('habit_logs', logs.filter((l) => l.habit_id !== id));
  emit('habits');
}

// --- Habit Logs ---

export function getHabitLogs(habitId) {
  return getStore('habit_logs').filter((l) => l.habit_id === habitId);
}

export function addHabitLog(habitId, date) {
  const rows = getStore('habit_logs');
  const log = {
    id: generateId(),
    habit_id: habitId,
    date,
    completed_at: new Date().toISOString(),
  };
  rows.push(log);
  setStore('habit_logs', rows);
  emit('habit_logs');
  return log;
}

export function deleteHabitLog(id) {
  const rows = getStore('habit_logs');
  setStore('habit_logs', rows.filter((r) => r.id !== id));
  emit('habit_logs');
}

// --- Focus Sessions ---

export function getFocusSessions(from, to) {
  let rows = [...getStore('focus_sessions')];
  if (from) rows = rows.filter((r) => r.started_at >= from);
  if (to) rows = rows.filter((r) => r.started_at <= to);
  rows.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
  return rows;
}

export function addFocusSession(taskId, durationMinutes) {
  const rows = getStore('focus_sessions');
  const session = {
    id: generateId(),
    task_id: taskId,
    started_at: new Date().toISOString(),
    ended_at: new Date().toISOString(),
    duration_minutes: durationMinutes,
    created_at: new Date().toISOString(),
  };
  rows.push(session);
  setStore('focus_sessions', rows);
  emit('focus_sessions');
  return session;
}
