import { useState, useMemo } from 'react';
import { ListChecks, Clock, Calendar } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskItem from '../../components/ui/TaskItem';
import TaskInput from '../../components/ui/TaskInput';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';
import { cn, formatDateFull, getTodayStr, isToday } from '../../lib/utils';
import { AREAS, AREA_LIST } from '../../lib/constants';

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
  const { todayTasks, nextActions, waitingFor } = useMemo(() => {
    let filtered = tasks;
    if (areaFilter) {
      filtered = filtered.filter((t) => t.area === areaFilter);
    }

    const todayTasks = filtered.filter(
      (t) => t.status === 'next_action' && (isToday(t.scheduled_date) || isToday(t.due_date))
    );
    const todayIds = new Set(todayTasks.map((t) => t.id));
    const nextActions = filtered.filter(
      (t) => t.status === 'next_action' && !todayIds.has(t.id)
    );
    const waitingFor = filtered.filter((t) => t.status === 'waiting_for');

    return { todayTasks, nextActions, waitingFor };
  }, [tasks, areaFilter]);

  // Group next actions by area
  const nextByArea = useMemo(() => {
    const grouped = {};
    for (const task of nextActions) {
      const area = task.area || 'none';
      if (!grouped[area]) grouped[area] = [];
      grouped[area].push(task);
    }
    return grouped;
  }, [nextActions]);

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

  const totalActions = todayTasks.length + nextActions.length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-slate-900">פעולות</h1>
        <p className="text-xs text-slate-400 mt-0.5">{formatDateFull(today)}</p>
      </div>

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
          {/* Today section */}
          {todayTasks.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                <Calendar size={14} />
                היום
                <span className="text-slate-400 font-normal">({todayTasks.length})</span>
              </h2>
              <div className="space-y-2">
                {todayTasks.map((task) => (
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

          {/* Next actions by area */}
          {Object.entries(nextByArea).map(([area, areaTasks]) => {
            const areaConfig = AREAS[area];
            return (
              <section key={area}>
                <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-1.5">
                  {areaConfig ? (
                    <>
                      <span className={cn('w-2.5 h-2.5 rounded-full', areaConfig.dot)} />
                      {areaConfig.label}
                    </>
                  ) : (
                    'ללא תחום'
                  )}
                  <span className="text-slate-400 font-normal">({areaTasks.length})</span>
                </h2>
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
              </section>
            );
          })}

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
