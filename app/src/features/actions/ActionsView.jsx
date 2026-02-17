import { useState, useMemo } from 'react';
import { ListChecks, Clock, Star, AlertTriangle, CalendarDays, AlertCircle, Timer } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskItem from '../../components/ui/TaskItem';
import TaskInput from '../../components/ui/TaskInput';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import FocusTimer from '../focus/FocusTimer';
import { useToast } from '../../hooks/useToast';
import { cn, formatDateFull, getTodayStr, totalEstimatedMinutes, formatMinutesAsHours, isOverdue } from '../../lib/utils';
import { AREAS, AREA_LIST, GTD } from '../../lib/constants';

export default function ActionsView() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useTasks({ status: ['next_action', 'waiting_for'] });
  const { projects } = useProjects({ is_active: true });
  const { addToast } = useToast();
  const [areaFilter, setAreaFilter] = useState(null);
  const [smartFilter, setSmartFilter] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [focusTask, setFocusTask] = useState(null);

  const today = getTodayStr();

  const smartCounts = useMemo(() => {
    const nextActions = tasks.filter((t) => t.status === 'next_action');
    const todayCount = nextActions.filter((t) => t.scheduled_date === today || t.due_date === today).length;
    const weekFromNow = new Date();
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    const weekStr = weekFromNow.toISOString().split('T')[0];
    const upcomingCount = nextActions.filter((t) => t.due_date && t.due_date > today && t.due_date <= weekStr).length;
    const overdueCount = nextActions.filter((t) => isOverdue(t.due_date)).length;
    return { today: todayCount, upcoming: upcomingCount, overdue: overdueCount };
  }, [tasks, today]);

  const { focusTasks, otherActions, waitingFor } = useMemo(() => {
    let filtered = tasks;
    if (areaFilter) filtered = filtered.filter((t) => t.area === areaFilter);
    if (smartFilter === 'today') filtered = filtered.filter((t) => t.scheduled_date === today || t.due_date === today);
    else if (smartFilter === 'upcoming') {
      const w = new Date(); w.setDate(w.getDate() + 7);
      filtered = filtered.filter((t) => t.due_date && t.due_date > today && t.due_date <= w.toISOString().split('T')[0]);
    } else if (smartFilter === 'overdue') filtered = filtered.filter((t) => isOverdue(t.due_date) && t.status !== 'done');

    const focusTasks = filtered.filter((t) => t.status === 'next_action' && t.is_focus);
    const focusIds = new Set(focusTasks.map((t) => t.id));
    const otherActions = filtered.filter((t) => t.status === 'next_action' && !focusIds.has(t.id));
    const waitingFor = filtered.filter((t) => t.status === 'waiting_for');
    return { focusTasks, otherActions, waitingFor };
  }, [tasks, areaFilter, smartFilter, today]);

  const allNextActions = useMemo(() => tasks.filter((t) => t.status === 'next_action'), [tasks]);
  const capacityMinutes = totalEstimatedMinutes(allNextActions.filter((t) => t.is_focus));
  const capacityPercent = GTD.MAX_DAILY_MINUTES > 0 ? Math.round((capacityMinutes / GTD.MAX_DAILY_MINUTES) * 100) : 0;
  const isOverloaded = capacityPercent > 100;
  const highPriorityCount = allNextActions.filter((t) => t.priority === 'high').length;
  const hasPriorityInflation = allNextActions.length > 0 && (highPriorityCount / allNextActions.length) > GTD.PRIORITY_INFLATION_THRESHOLD;

  const otherByArea = useMemo(() => {
    const grouped = {};
    for (const task of otherActions) { const a = task.area || 'none'; if (!grouped[a]) grouped[a] = []; grouped[a].push(task); }
    return grouped;
  }, [otherActions]);

  const handleComplete = async (id) => {
    const task = tasks.find((t) => t.id === id);
    try {
      await completeTask(id);
      addToast(`"${task?.title}" הושלמה!`, { action: { label: 'ביטול', onClick: () => updateTask(id, { status: 'next_action', completed_at: null }) } });
    } catch { addToast('שגיאה בהשלמה'); }
  };

  const handleDelete = async (id) => {
    try { await deleteTask(id); addToast('משימה נמחקה', { action: { label: 'ביטול', onClick: () => updateTask(id, { status: 'next_action' }) } });
    } catch { addToast('שגיאה במחיקה'); }
  };

  const handleAddAction = async ({ title, area }) => {
    try { await addTask({ title, status: 'next_action', area }); } catch { addToast('שגיאה בהוספת משימה'); }
  };

  const handleEditSave = async (id, updates) => {
    try { await updateTask(id, updates); setEditingTask(null); addToast('משימה עודכנה'); } catch { addToast('שגיאה בשמירה'); }
  };

  const totalActions = focusTasks.length + otherActions.length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">פעולות</h1>
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">{formatDateFull(today)}</p>
      </div>

      {/* Capacity Bar */}
      {focusTasks.length > 0 && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-gray-300">קיבולת יומית</span>
            <span className="text-xs text-slate-500 dark:text-gray-400">{formatMinutesAsHours(capacityMinutes)} / {formatMinutesAsHours(GTD.MAX_DAILY_MINUTES)}</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full transition-all', capacityPercent > 90 ? 'bg-red-500' : capacityPercent > 60 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }} />
          </div>
        </div>
      )}

      {isOverloaded && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2.5">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-700 dark:text-red-400">עומס יתר! שקול לדחות משימות</span>
        </div>
      )}
      {hasPriorityInflation && (
        <div className="mb-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2.5">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700 dark:text-amber-400">אינפלציית עדיפויות — לא הכל דחוף</span>
        </div>
      )}

      {/* Smart lists */}
      <div className="flex gap-2 mb-3 overflow-x-auto scrollbar-hide">
        {smartCounts.today > 0 && (
          <button onClick={() => setSmartFilter(smartFilter === 'today' ? null : 'today')}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-colors touch-target',
              smartFilter === 'today' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700')}>
            <CalendarDays size={13} />היום ({smartCounts.today})
          </button>
        )}
        {smartCounts.upcoming > 0 && (
          <button onClick={() => setSmartFilter(smartFilter === 'upcoming' ? null : 'upcoming')}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-colors touch-target',
              smartFilter === 'upcoming' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700')}>
            <Clock size={13} />בקרוב ({smartCounts.upcoming})
          </button>
        )}
        {smartCounts.overdue > 0 && (
          <button onClick={() => setSmartFilter(smartFilter === 'overdue' ? null : 'overdue')}
            className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border shrink-0 transition-colors touch-target',
              smartFilter === 'overdue' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800' : 'bg-white dark:bg-gray-800 text-red-500 dark:text-red-400 border-red-200 dark:border-red-800')}>
            <AlertCircle size={13} />באיחור ({smartCounts.overdue})
          </button>
        )}
      </div>

      {/* Area filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
        <button onClick={() => setAreaFilter(null)}
          className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 touch-target',
            !areaFilter ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600' : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700')}>
          הכל
        </button>
        {AREA_LIST.map((a) => (
          <button key={a.id} onClick={() => setAreaFilter(areaFilter === a.id ? null : a.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0 touch-target',
              areaFilter === a.id ? `${a.lightBg} ${a.text} ${a.border}` : 'bg-white dark:bg-gray-800 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700')}>
            {a.label}
          </button>
        ))}
      </div>

      <TaskInput onAdd={handleAddAction} placeholder="פעולה חדשה..." area={areaFilter} className="mb-5" />

      {totalActions === 0 && waitingFor.length === 0 ? (
        <EmptyState icon={ListChecks} title="אין פעולות" description="עבד את תיבת הדואר כדי להוסיף פעולות חדשות" />
      ) : (
        <div className="space-y-6">
          {focusTasks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-2 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />מיקוד
                <span className="text-slate-400 dark:text-gray-500 font-normal">({focusTasks.length}/{GTD.MAX_FOCUS_TASKS})</span>
              </h2>
              <div className="space-y-2">
                {focusTasks.map((task) => (
                  <div key={task.id} className="relative">
                    <TaskItem task={task} onComplete={handleComplete} onDelete={handleDelete} onEdit={setEditingTask} />
                    <button
                      onClick={() => setFocusTask(task)}
                      className="absolute top-3 left-12 p-1.5 rounded-lg bg-slate-100 dark:bg-gray-700 text-slate-500 dark:text-gray-400 active:bg-slate-200 dark:active:bg-gray-600 transition-colors"
                      aria-label="פומודורו"
                    >
                      <Timer size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {Object.keys(otherByArea).length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 dark:text-gray-400 mb-2">
                {focusTasks.length > 0 ? 'אם יש זמן' : 'פעולות הבאות'}
              </h2>
              <div className="space-y-4">
                {Object.entries(otherByArea).map(([area, areaTasks]) => {
                  const areaConfig = AREAS[area];
                  return (
                    <div key={area}>
                      <h3 className="text-xs font-medium text-slate-400 dark:text-gray-500 mb-1.5 flex items-center gap-1.5">
                        {areaConfig ? (<><span className={cn('w-2 h-2 rounded-full', areaConfig.dot)} />{areaConfig.label}</>) : 'ללא תחום'}
                        <span className="font-normal">({areaTasks.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {areaTasks.map((task) => (
                          <TaskItem key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} onEdit={setEditingTask} showArea={false} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {waitingFor.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                <Clock size={14} />ממתין ל...<span className="font-normal">({waitingFor.length})</span>
              </h2>
              <div className="space-y-2">
                {waitingFor.map((task) => (
                  <TaskItem key={task.id} task={task} onComplete={handleComplete} onDelete={handleDelete} onEdit={setEditingTask} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {editingTask && <EditTaskModal task={editingTask} projects={projects} onSave={handleEditSave} onClose={() => setEditingTask(null)} />}
      {focusTask && <FocusTimer task={focusTask} onClose={() => setFocusTask(null)} onComplete={handleComplete} />}
    </div>
  );
}
