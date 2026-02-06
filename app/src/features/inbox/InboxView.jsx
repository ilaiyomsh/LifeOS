import { useState, useMemo } from 'react';
import { Inbox, Sparkles, ArrowLeft, ArrowRight, Trash2, Clock, Star, ArchiveX } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskInput from '../../components/ui/TaskInput';
import TaskItem from '../../components/ui/TaskItem';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { AREA_LIST } from '../../lib/constants';

export default function InboxView() {
  const { tasks, addTask, updateTask, deleteTask } = useTasks({ status: 'inbox' });
  const { projects } = useProjects({ is_active: true });
  const { addToast } = useToast();
  const [mode, setMode] = useState('capture'); // 'capture' | 'clarify'
  const [clarifyIndex, setClarifyIndex] = useState(0);
  const [editingTask, setEditingTask] = useState(null);

  const inboxTasks = useMemo(() => tasks.filter((t) => t.status === 'inbox'), [tasks]);
  const currentTask = inboxTasks[clarifyIndex];

  const handleAdd = async ({ title }) => {
    try {
      await addTask({ title, status: 'inbox' });
    } catch {
      addToast('שגיאה בהוספת משימה');
    }
  };

  const handleClarify = async (action) => {
    if (!currentTask) return;

    try {
      switch (action) {
        case 'next_action':
          await updateTask(currentTask.id, { status: 'next_action' });
          addToast('הועבר לפעולות הבאות');
          break;
        case 'waiting_for':
          await updateTask(currentTask.id, { status: 'waiting_for' });
          addToast('הועבר לממתין');
          break;
        case 'someday':
          await updateTask(currentTask.id, { status: 'someday' });
          addToast('הועבר ליום אחד/אולי');
          break;
        case 'trash':
          await deleteTask(currentTask.id);
          addToast('נמחק', {
            action: {
              label: 'ביטול',
              onClick: () => updateTask(currentTask.id, { status: 'inbox' }),
            },
          });
          break;
      }
    } catch {
      addToast('שגיאה בעדכון משימה');
    }

    // Move to next or wrap
    if (clarifyIndex >= inboxTasks.length - 1) {
      setClarifyIndex(0);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteTask(id);
      addToast('משימה נמחקה', {
        action: {
          label: 'ביטול',
          onClick: () => updateTask(id, { status: 'inbox' }),
        },
      });
    } catch {
      addToast('שגיאה במחיקה');
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

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">תיבת דואר</h1>
          <p className="text-xs text-slate-400 mt-0.5">תעד → עבד → ארגן</p>
        </div>
        {inboxTasks.length > 0 && <Badge count={inboxTasks.length} />}
      </div>

      {/* Mode toggle */}
      {inboxTasks.length > 0 && (
        <div className="flex bg-slate-100 rounded-lg p-1 mb-4">
          <button
            onClick={() => setMode('capture')}
            className={cn(
              'flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'capture' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            תיעוד
          </button>
          <button
            onClick={() => { setMode('clarify'); setClarifyIndex(0); }}
            className={cn(
              'flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'clarify' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            )}
          >
            עיבוד ({inboxTasks.length})
          </button>
        </div>
      )}

      {/* Capture mode */}
      {mode === 'capture' && (
        <>
          <TaskInput onAdd={handleAdd} placeholder="מה צריך לעשות?" className="mb-4" />

          {inboxTasks.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="תיבת הדואר ריקה"
              description="הוסף משימות חדשות כאן. כל מה שעולה לך לראש."
            />
          ) : (
            <div className="space-y-2">
              {inboxTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onDelete={handleDelete}
                  onEdit={setEditingTask}
                  showArea={false}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Clarify mode */}
      {mode === 'clarify' && (
        <>
          {inboxTasks.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              title="הכל עובד!"
              description="כל הפריטים בתיבת הדואר עובדו. כל הכבוד!"
            />
          ) : currentTask ? (
            <div className="space-y-4">
              {/* Progress */}
              <div className="text-center text-xs text-slate-400">
                {clarifyIndex + 1} מתוך {inboxTasks.length}
              </div>

              {/* Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <p className="text-lg font-semibold text-slate-900 text-center mb-2">
                  {currentTask.title}
                </p>
                {currentTask.notes && (
                  <p className="text-sm text-slate-500 text-center">{currentTask.notes}</p>
                )}
              </div>

              {/* Quick-edit before deciding */}
              <div className="flex gap-2">
                {AREA_LIST.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => updateTask(currentTask.id, { area: a.id })}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                      currentTask.area === a.id
                        ? `${a.lightBg} ${a.text} ${a.border}`
                        : 'bg-white border-slate-200 text-slate-500'
                    )}
                  >
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleClarify('next_action')}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-800 transition-colors"
                >
                  <Star size={16} />
                  פעולה הבאה
                </button>
                <button
                  onClick={() => handleClarify('waiting_for')}
                  className="flex items-center justify-center gap-2 py-3 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors"
                >
                  <Clock size={16} />
                  ממתין ל...
                </button>
                <button
                  onClick={() => handleClarify('someday')}
                  className="flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                >
                  <ArchiveX size={16} />
                  יום אחד
                </button>
                <button
                  onClick={() => handleClarify('trash')}
                  className="flex items-center justify-center gap-2 py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={16} />
                  מחיקה
                </button>
              </div>

              {/* Edit button */}
              <button
                onClick={() => setEditingTask(currentTask)}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                עריכה מפורטת...
              </button>

              {/* Navigation */}
              {inboxTasks.length > 1 && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => setClarifyIndex((i) => Math.max(0, i - 1))}
                    disabled={clarifyIndex === 0}
                    className="p-2 text-slate-400 disabled:opacity-30"
                    aria-label="הקודם"
                  >
                    <ArrowRight size={20} />
                  </button>
                  <button
                    onClick={() => setClarifyIndex((i) => Math.min(inboxTasks.length - 1, i + 1))}
                    disabled={clarifyIndex === inboxTasks.length - 1}
                    className="p-2 text-slate-400 disabled:opacity-30"
                    aria-label="הבא"
                  >
                    <ArrowLeft size={20} />
                  </button>
                </div>
              )}
            </div>
          ) : null}
        </>
      )}

      {/* Edit Modal */}
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
