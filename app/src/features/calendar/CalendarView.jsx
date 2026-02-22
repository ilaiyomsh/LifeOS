import { useState, useMemo, useCallback } from 'react';
import { Calendar, ChevronRight, ChevronLeft, Plus, X, Clock } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useEvents } from '../../hooks/useEvents';
import { useToast } from '../../hooks/useToast';
import TaskItem from '../../components/ui/TaskItem';
import EditTaskModal from '../../components/ui/EditTaskModal';
import { useProjects } from '../../hooks/useProjects';
import { cn, formatDate } from '../../lib/utils';
import { AREAS } from '../../lib/constants';

function getWeekDays(baseDate) {
  const start = new Date(baseDate);
  const day = start.getDay();
  start.setDate(start.getDate() - day);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

function toDateStr(d) {
  return d.toISOString().split('T')[0];
}

const DAY_NAMES = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
const MONTH_NAMES = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

export default function CalendarView() {
  const [baseDate, setBaseDate] = useState(new Date());
  const [view, setView] = useState('week'); // 'week' | 'month'
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventTime, setEventTime] = useState('09:00');
  const [editingTask, setEditingTask] = useState(null);

  const todayStr = toDateStr(new Date());

  // Date range for data fetching
  const dateRange = useMemo(() => {
    if (view === 'week') {
      const days = getWeekDays(baseDate);
      return { from: days[0].toISOString(), to: new Date(days[6].getTime() + 86400000).toISOString() };
    }
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    return { from: new Date(y, m, 1).toISOString(), to: new Date(y, m + 1, 1).toISOString() };
  }, [baseDate, view]);

  const { tasks, updateTask, completeTask } = useTasks({});
  const { events, addEvent, deleteEvent } = useEvents(dateRange.from, dateRange.to);
  const { projects, addProject } = useProjects({ is_active: true });
  const { addToast } = useToast();

  // Scheduled tasks grouped by date
  const tasksByDate = useMemo(() => {
    const map = {};
    for (const t of tasks) {
      const d = t.scheduled_date || t.due_date;
      if (d && t.status !== 'done' && t.status !== 'trashed') {
        if (!map[d]) map[d] = [];
        map[d].push(t);
      }
    }
    return map;
  }, [tasks]);

  // Events grouped by date
  const eventsByDate = useMemo(() => {
    const map = {};
    for (const e of events) {
      const d = e.start_at?.split('T')[0];
      if (d) {
        if (!map[d]) map[d] = [];
        map[d].push(e);
      }
    }
    return map;
  }, [events]);

  const weekDays = useMemo(() => getWeekDays(baseDate), [baseDate]);

  // Month grid
  const monthGrid = useMemo(() => {
    const y = baseDate.getFullYear();
    const m = baseDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [baseDate]);

  const navigate = (dir) => {
    const d = new Date(baseDate);
    if (view === 'week') d.setDate(d.getDate() + dir * 7);
    else d.setMonth(d.getMonth() + dir);
    setBaseDate(d);
  };

  const goToToday = () => setBaseDate(new Date());

  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!eventTitle.trim() || !selectedDate) return;
    try {
      const start = new Date(`${selectedDate}T${eventTime}`);
      const end = new Date(start.getTime() + 3600000);
      await addEvent({ title: eventTitle.trim(), start_at: start.toISOString(), end_at: end.toISOString() });
      setEventTitle('');
      setShowEventForm(false);
      addToast('אירוע נוסף');
    } catch {
      addToast('שגיאה בהוספת אירוע');
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      await deleteEvent(id);
      addToast('אירוע נמחק');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      addToast('הושלם!');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleEditSave = async (id, updates) => {
    try {
      await updateTask(id, updates);
      setEditingTask(null);
      addToast('עודכן');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleConvertToProject = async (task) => {
    if (!task.area) { addToast('יש לבחור תחום לפני הפיכה לפרויקט'); return; }
    try {
      const project = await addProject({ title: task.title, area: task.area });
      await updateTask(task.id, { project_id: project.id, status: 'next_action' });
      setEditingTask(null);
      addToast('המשימה הפכה לפרויקט');
    } catch { addToast('שגיאה בהפיכה לפרויקט'); }
  };

  const getDayItems = useCallback((dateStr) => {
    const dayTasks = tasksByDate[dateStr] || [];
    const dayEvents = eventsByDate[dateStr] || [];
    return { tasks: dayTasks, events: dayEvents, total: dayTasks.length + dayEvents.length };
  }, [tasksByDate, eventsByDate]);

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">
            {MONTH_NAMES[baseDate.getMonth()]} {baseDate.getFullYear()}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg active:bg-slate-200 dark:active:bg-gray-700"
          >
            היום
          </button>
          <div className="flex bg-slate-100 dark:bg-gray-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('week')}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors', view === 'week' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-sm' : 'text-slate-500 dark:text-gray-400')}
            >
              שבוע
            </button>
            <button
              onClick={() => setView('month')}
              className={cn('px-2.5 py-1 text-xs font-medium rounded-md transition-colors', view === 'month' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-sm' : 'text-slate-500 dark:text-gray-400')}
            >
              חודש
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => navigate(1)} className="p-2 rounded-lg active:bg-slate-100 dark:active:bg-gray-800 touch-target">
          <ChevronRight size={20} className="text-slate-500 dark:text-gray-400" />
        </button>
        <span className="text-sm font-medium text-slate-600 dark:text-gray-300">
          {view === 'week' ? `${formatDate(toDateStr(weekDays[0]))} - ${formatDate(toDateStr(weekDays[6]))}` : ''}
        </span>
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg active:bg-slate-100 dark:active:bg-gray-800 touch-target">
          <ChevronLeft size={20} className="text-slate-500 dark:text-gray-400" />
        </button>
      </div>

      {/* Week View */}
      {view === 'week' && (
        <div className="space-y-1 mb-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((d, i) => {
              const ds = toDateStr(d);
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const items = getDayItems(ds);
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                  className={cn(
                    'flex flex-col items-center py-2 rounded-xl transition-colors touch-target',
                    isSelected ? 'bg-slate-900 dark:bg-blue-600 text-white' :
                    isToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    'active:bg-slate-100 dark:active:bg-gray-800'
                  )}
                >
                  <span className={cn('text-[10px] mb-0.5', isSelected ? 'text-white/70' : 'text-slate-400 dark:text-gray-500')}>
                    {DAY_NAMES[d.getDay()]}
                  </span>
                  <span className={cn('text-sm font-semibold', !isSelected && !isToday && 'text-slate-800 dark:text-gray-200')}>
                    {d.getDate()}
                  </span>
                  {items.total > 0 && (
                    <div className={cn('w-1.5 h-1.5 rounded-full mt-1', isSelected ? 'bg-white/60' : 'bg-blue-500')} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day detail */}
          {selectedDate && (
            <div className="animate-scale-in space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                  {new Date(selectedDate + 'T00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button
                  onClick={() => { setShowEventForm(!showEventForm); }}
                  className="p-2 rounded-lg bg-slate-900 dark:bg-blue-600 text-white active:opacity-80 touch-target"
                  aria-label="הוסף אירוע"
                >
                  <Plus size={16} />
                </button>
              </div>

              {/* Add event form */}
              {showEventForm && (
                <form onSubmit={handleAddEvent} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 space-y-2 animate-slide-down">
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="שם האירוע"
                    className="w-full text-sm bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-700 focus:outline-none dark:text-gray-100"
                    dir="rtl"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="text-sm bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-700 focus:outline-none dark:text-gray-100"
                    />
                    <button type="submit" className="flex-1 bg-slate-900 dark:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold active:opacity-80">
                      הוסף
                    </button>
                    <button type="button" onClick={() => setShowEventForm(false)} className="px-3 py-2 text-slate-400 active:text-slate-600">
                      <X size={16} />
                    </button>
                  </div>
                </form>
              )}

              {/* Events */}
              {(eventsByDate[selectedDate] || []).map((evt) => (
                <div key={evt.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 px-4 py-3 flex items-center gap-3">
                  <Clock size={14} className="text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{evt.title}</p>
                    {evt.start_at && (
                      <p className="text-[11px] text-blue-600 dark:text-blue-400">
                        {new Date(evt.start_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                        {evt.end_at && ` - ${new Date(evt.end_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}`}
                      </p>
                    )}
                  </div>
                  <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 text-blue-400 active:text-red-500">
                    <X size={14} />
                  </button>
                </div>
              ))}

              {/* Tasks */}
              {(tasksByDate[selectedDate] || []).map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onComplete={handleComplete}
                  onEdit={setEditingTask}
                />
              ))}

              {getDayItems(selectedDate).total === 0 && (
                <p className="text-center text-sm text-slate-400 dark:text-gray-500 py-6">אין אירועים או משימות ליום זה</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Month View */}
      {view === 'month' && (
        <div className="mb-4">
          {/* Day name headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_NAMES.map((name) => (
              <div key={name} className="text-center text-[10px] font-medium text-slate-400 dark:text-gray-500 py-1">{name}</div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {monthGrid.map((d, i) => {
              if (!d) return <div key={`empty-${i}`} />;
              const ds = toDateStr(d);
              const isToday = ds === todayStr;
              const isSelected = ds === selectedDate;
              const items = getDayItems(ds);
              return (
                <button
                  key={ds}
                  onClick={() => setSelectedDate(ds === selectedDate ? null : ds)}
                  className={cn(
                    'aspect-square flex flex-col items-center justify-center rounded-lg text-sm transition-colors',
                    isSelected ? 'bg-slate-900 dark:bg-blue-600 text-white' :
                    isToday ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold' :
                    'text-slate-700 dark:text-gray-300 active:bg-slate-100 dark:active:bg-gray-800'
                  )}
                >
                  {d.getDate()}
                  {items.total > 0 && (
                    <div className={cn('w-1 h-1 rounded-full mt-0.5', isSelected ? 'bg-white/60' : 'bg-blue-500')} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected day detail for month view */}
          {selectedDate && (
            <div className="mt-4 animate-scale-in space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-200">
                  {new Date(selectedDate + 'T00:00').toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
                </h3>
                <button
                  onClick={() => setShowEventForm(!showEventForm)}
                  className="p-2 rounded-lg bg-slate-900 dark:bg-blue-600 text-white active:opacity-80 touch-target"
                  aria-label="הוסף אירוע"
                >
                  <Plus size={16} />
                </button>
              </div>

              {showEventForm && (
                <form onSubmit={handleAddEvent} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 space-y-2 animate-slide-down">
                  <input
                    type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="שם האירוע" className="w-full text-sm bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-700 focus:outline-none dark:text-gray-100" dir="rtl" autoFocus
                  />
                  <div className="flex gap-2">
                    <input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} className="text-sm bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2 border border-slate-200 dark:border-gray-700 focus:outline-none dark:text-gray-100" />
                    <button type="submit" className="flex-1 bg-slate-900 dark:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold active:opacity-80">הוסף</button>
                    <button type="button" onClick={() => setShowEventForm(false)} className="px-3 py-2 text-slate-400"><X size={16} /></button>
                  </div>
                </form>
              )}

              {(eventsByDate[selectedDate] || []).map((evt) => (
                <div key={evt.id} className="bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800 px-4 py-3 flex items-center gap-3">
                  <Clock size={14} className="text-blue-500 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">{evt.title}</p>
                    {evt.start_at && <p className="text-[11px] text-blue-600 dark:text-blue-400">{new Date(evt.start_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>}
                  </div>
                  <button onClick={() => handleDeleteEvent(evt.id)} className="p-1.5 text-blue-400 active:text-red-500"><X size={14} /></button>
                </div>
              ))}

              {(tasksByDate[selectedDate] || []).map((task) => (
                <TaskItem key={task.id} task={task} onComplete={handleComplete} onEdit={setEditingTask} />
              ))}

              {getDayItems(selectedDate).total === 0 && (
                <p className="text-center text-sm text-slate-400 dark:text-gray-500 py-6">אין אירועים או משימות ליום זה</p>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedDate && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Calendar size={24} className="text-slate-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-gray-400">בחר יום כדי לראות אירועים ומשימות</p>
        </div>
      )}

      {editingTask && (
        <EditTaskModal task={editingTask} projects={projects} onSave={handleEditSave} onClose={() => setEditingTask(null)} onConvertToProject={handleConvertToProject} />
      )}
    </div>
  );
}
