import { useState, useMemo } from 'react';
import { ListChecks, Clock, Star, AlertTriangle } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskItem from '../../components/ui/TaskItem';
import TaskInput from '../../components/ui/TaskInput';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';
import { cn, formatDateFull, getTodayStr, totalEstimatedMinutes, formatMinutesAsHours } from '../../lib/utils';
import { AREAS, AREA_LIST, GTD } from '../../lib/constants';

export default function ActionsView() {
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useTasks({
    status: ['next_action', 'waiting_for'],
  });
  const { projects } = useProjects({ is_active: true });
  const { addToast } = useToast();
  const [areaFilter, setAreaFilter] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const today = getTodayStr();

  // Split tasks into groups
  const { focusTasks, otherActions, waitingFor } = useMemo(() => {
    let filtered = tasks;
    if (areaFilter) {
      filtered = filtered.filter((t) => t.area === areaFilter);
    }

    const focusTasks = filtered.filter(
      (t) => t.status === 'next_action' && t.is_focus
    );
    const focusIds = new Set(focusTasks.map((t) => t.id));
    const otherActions = filtered.filter(
      (t) => t.status === 'next_action' && !focusIds.has(t.id)
    );
    const waitingFor = filtered.filter((t) => t.status === 'waiting_for');

    return { focusTasks, otherActions, waitingFor };
  }, [tasks, areaFilter]);

  // Capacity calculations
  const allNextActions = useMemo(() => tasks.filter((t) => t.status === 'next_action'), [tasks]);
  const capacityMinutes = totalEstimatedMinutes(allNextActions.filter((t) => t.is_focus));
  const capacityPercent = GTD.MAX_DAILY_MINUTES > 0 ? Math.round((capacityMinutes / GTD.MAX_DAILY_MINUTES) * 100) : 0;
  const isOverloaded = capacityPercent > 100;

  // Priority inflation check
  const highPriorityCount = allNextActions.filter((t) => t.priority === 'high').length;
  const hasPriorityInflation = allNextActions.length > 0 && (highPriorityCount / allNextActions.length) > GTD.PRIORITY_INFLATION_THRESHOLD;

  // Group other actions by area
  const otherByArea = useMemo(() => {
    const grouped = {};
    for (const task of otherActions) {
      const area = task.area || 'none';
      if (!grouped[area]) grouped[area] = [];
      grouped[area].push(task);
    }
    return grouped;
  }, [otherActions]);

  const handleComplete = async (id) => {
    const task = tasks.find((t) => t.id === id);
    try {
      await completeTask(id);
      addToast(`"${task?.title}" הושלמה!`, {
        action: {
          label: 'ביטול',
          onClick: () => updateTask(id, { status: 'next_action', completed_at: null }),
        },
      });
    } catch {
      addToast('שגיאה בהשלמה');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      addToast('משימה נמחקה', {
        action: { label: 'ביטול', onClick: () => updateTask(id, { status: 'next_action' }) },
      });
    } catch {
      addToast('שגיאה במחיקה');
    }
  };

  const handleAddAction = async ({ title, area }) => {
    try {
      await addTask({ title, status: 'next_action', area });
    } catch {
      addToast('שגיאה בהוספת משימה');
    }
  };

  const handleEditSave = async (id, updates) => {
    try {
      await updateTask(id, updates);
      setEditingTask(null);
      addToast('משימה עודכנה');
    } catch {
      addToast('שגיאה בשמירה');
    }
  };

  const totalActions = focusTasks.length + otherActions.length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">פעולות</h1>
        <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(today)}</p>
      </div>

      {/* Capacity Bar */}
      {focusTasks.length > 0 && (
        <div className="mb-4 bg-white rounded-xl border border-slate-200 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600">קיבולת יומית</span>
            <span className="text-xs text-slate-500">
              {formatMinutesAsHours(capacityMinutes)} / {formatMinutesAsHours(GTD.MAX_DAILY_MINUTES)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                capacityPercent > 90 ? 'bg-red-500'
                  : capacityPercent > 60 ? 'bg-amber-500'
                  : 'bg-emerald-500'
              )}
              style={{ width: `${Math.min(capacityPercent, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Warnings */}
      {isOverloaded && (
        <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2.5">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <span className="text-xs text-red-700">עומס יתר! שקול לדחות משימות</span>
        </div>
      )}
      {hasPriorityInflation && (
        <div className="mb-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
          <AlertTriangle size={16} className="text-amber-500 shrink-0" />
          <span className="text-xs text-amber-700">אינפלציית עדיפויות — לא הכל דחוף</span>
        </div>
      )}

      {/* Area filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setAreaFilter(null)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0',
            !areaFilter ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-500 border-slate-200'
          )}
        >
          הכל
        </button>
        {AREA_LIST.map((a) => (
          <button
            key={a.id}
            onClick={() => setAreaFilter(areaFilter === a.id ? null : a.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors shrink-0',
              areaFilter === a.id
                ? `${a.lightBg} ${a.text} ${a.border}`
                : 'bg-white text-slate-500 border-slate-200'
            )}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* Quick add */}
      <TaskInput
        onAdd={handleAddAction}
        placeholder="פעולה חדשה..."
        area={areaFilter}
        className="mb-5"
      />

      {totalActions === 0 && waitingFor.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="אין פעולות"
          description="עבד את תיבת הדואר כדי להוסיף פעולות חדשות"
        />
      ) : (
        <div className="space-y-6">
          {/* Focus section */}
          {focusTasks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Star size={14} className="text-amber-500" />
                מיקוד
                <span className="text-slate-400 font-normal">({focusTasks.length}/{GTD.MAX_FOCUS_TASKS})</span>
              </h2>
              <div className="space-y-2">
                {focusTasks.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Other actions by area */}
          {Object.keys(otherByArea).length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-500 mb-2">
                {focusTasks.length > 0 ? 'אם יש זמן' : 'פעולות הבאות'}
              </h2>
              <div className="space-y-4">
                {Object.entries(otherByArea).map(([area, areaTasks]) => {
                  const areaConfig = AREAS[area];
                  return (
                    <div key={area}>
                      <h3 className="text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                        {areaConfig ? (
                          <>
                            <span className={cn('w-2 h-2 rounded-full', areaConfig.dot)} />
                            {areaConfig.label}
                          </>
                        ) : (
                          'ללא תחום'
                        )}
                        <span className="font-normal">({areaTasks.length})</span>
                      </h3>
                      <div className="space-y-2">
                        {areaTasks.map((task) => (
                          <TaskItem
                            key={task.id}
                            task={task}
                            onComplete={handleComplete}
                            onDelete={handleDelete}
                            onEdit={setEditingTask}
                            showArea={false}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Waiting for */}
          {waitingFor.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-1.5">
                <Clock size={14} />
                ממתין ל...
                <span className="font-normal">({waitingFor.length})</span>
              </h2>
              <div className="space-y-2">
                {waitingFor.map((task) => (
                  <TaskItem
                    key={task.id}
                    task={task}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                    onEdit={setEditingTask}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {editingTask && (
        <EditTaskModal
          task={editingTask}
          projects={projects}
          onSave={handleEditSave}
          onClose={() => setEditingTask(null)}
        />
      )}
    </div>
  );
}
