import { useState, useMemo } from 'react';
import { Inbox, Sparkles, ArrowLeft, ArrowRight, Trash2, Clock, Star, ArchiveX, Zap, HelpCircle } from 'lucide-react';
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
  const [clarifyStep, setClarifyStep] = useState(1); // 1: actionable? | 2: 2-min? | 3: decide
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

    setClarifyStep(1);
    // Move to next or wrap
    if (clarifyIndex >= inboxTasks.length - 1) {
      setClarifyIndex(0);
    }
  };

  const handleQuickDo = async () => {
    if (!currentTask) return;
    try {
      await updateTask(currentTask.id, { status: 'next_action', estimated_minutes: 2 });
      addToast('עשה את זה עכשיו! (2 דק׳)');
    } catch {
      addToast('שגיאה בעדכון משימה');
    }
    setClarifyStep(1);
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
          <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">תיבת דואר</h1>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">תעד → עבד → ארגן</p>
        </div>
        {inboxTasks.length > 0 && <Badge count={inboxTasks.length} />}
      </div>

      {/* Mode toggle */}
      {inboxTasks.length > 0 && (
        <div className="flex bg-slate-100 dark:bg-gray-800 rounded-lg p-1 mb-4">
          <button
            onClick={() => setMode('capture')}
            className={cn(
              'flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'capture' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-sm' : 'text-slate-500 dark:text-gray-400'
            )}
          >
            תיעוד
          </button>
          <button
            onClick={() => { setMode('clarify'); setClarifyIndex(0); setClarifyStep(1); }}
            className={cn(
              'flex-1 text-center py-2 rounded-md text-sm font-medium transition-colors',
              mode === 'clarify' ? 'bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 shadow-sm' : 'text-slate-500 dark:text-gray-400'
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
              <div className="text-center text-xs text-slate-400 dark:text-gray-500">
                {clarifyIndex + 1} מתוך {inboxTasks.length}
              </div>

              {/* Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-200 dark:border-gray-700 p-6 shadow-sm">
                <p className="text-lg font-semibold text-slate-900 dark:text-gray-100 text-center mb-2">
                  {currentTask.title}
                </p>
                {currentTask.notes && (
                  <p className="text-sm text-slate-500 dark:text-gray-400 text-center">{currentTask.notes}</p>
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
                        : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>

              {/* GTD Decision Tree */}
              {clarifyStep === 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center">האם זה ניתן לפעולה?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setClarifyStep(2)}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-slate-800 dark:active:bg-blue-700 transition-colors"
                    >
                      <Star size={16} />
                      כן, ניתן לפעולה
                    </button>
                    <button
                      onClick={() => setClarifyStep('not_actionable')}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold active:bg-slate-100 dark:active:bg-gray-700 transition-colors"
                    >
                      <HelpCircle size={16} />
                      לא
                    </button>
                  </div>
                </div>
              )}

              {clarifyStep === 'not_actionable' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center">מה לעשות עם זה?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleClarify('someday')}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 rounded-xl text-sm font-semibold active:bg-slate-100 dark:active:bg-gray-700 transition-colors"
                    >
                      <ArchiveX size={16} />
                      יום אחד/אולי
                    </button>
                    <button
                      onClick={() => handleClarify('trash')}
                      className="flex items-center justify-center gap-2 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl text-sm font-semibold active:bg-red-100 dark:active:bg-red-900/30 transition-colors"
                    >
                      <Trash2 size={16} />
                      מחיקה
                    </button>
                  </div>
                  <button
                    onClick={() => setClarifyStep(1)}
                    className="w-full py-2 text-xs text-slate-400 dark:text-gray-500 active:text-slate-600 dark:active:text-gray-300"
                  >
                    חזרה
                  </button>
                </div>
              )}

              {clarifyStep === 2 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center">זה לוקח פחות מ-2 דקות?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleQuickDo}
                      className="flex items-center justify-center gap-2 py-3 bg-emerald-500 text-white rounded-xl text-sm font-semibold active:bg-emerald-600 transition-colors"
                    >
                      <Zap size={16} />
                      כן — עשה עכשיו!
                    </button>
                    <button
                      onClick={() => setClarifyStep(3)}
                      className="flex items-center justify-center gap-2 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-slate-800 dark:active:bg-blue-700 transition-colors"
                    >
                      לא — תכנן
                    </button>
                  </div>
                  <button
                    onClick={() => setClarifyStep(1)}
                    className="w-full py-2 text-xs text-slate-400 dark:text-gray-500 active:text-slate-600 dark:active:text-gray-300"
                  >
                    חזרה
                  </button>
                </div>
              )}

              {clarifyStep === 3 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700 dark:text-gray-300 text-center">מה הצעד הבא?</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleClarify('next_action')}
                      className="flex flex-col items-center justify-center gap-1 py-3 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-semibold active:bg-slate-800 dark:active:bg-blue-700 transition-colors"
                    >
                      <Star size={16} />
                      פעולה הבאה
                    </button>
                    <button
                      onClick={() => handleClarify('waiting_for')}
                      className="flex flex-col items-center justify-center gap-1 py-3 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-semibold active:bg-amber-100 dark:active:bg-amber-900/30 transition-colors"
                    >
                      <Clock size={16} />
                      ממתין ל...
                    </button>
                    <button
                      onClick={() => handleClarify('someday')}
                      className="flex flex-col items-center justify-center gap-1 py-3 bg-slate-50 dark:bg-gray-800 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-gray-700 rounded-xl text-xs font-semibold active:bg-slate-100 dark:active:bg-gray-700 transition-colors"
                    >
                      <ArchiveX size={16} />
                      יום אחד
                    </button>
                  </div>
                  <button
                    onClick={() => setClarifyStep(2)}
                    className="w-full py-2 text-xs text-slate-400 dark:text-gray-500 active:text-slate-600 dark:active:text-gray-300"
                  >
                    חזרה
                  </button>
                </div>
              )}

              {/* Edit button */}
              <button
                onClick={() => setEditingTask(currentTask)}
                className="w-full py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition-colors"
              >
                עריכה מפורטת...
              </button>

              {/* Navigation */}
              {inboxTasks.length > 1 && (
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => { setClarifyIndex((i) => Math.max(0, i - 1)); setClarifyStep(1); }}
                    disabled={clarifyIndex === 0}
                    className="p-3 text-slate-400 dark:text-gray-500 disabled:opacity-30 active:bg-slate-100 dark:active:bg-gray-800 rounded-xl"
                    aria-label="הקודם"
                  >
                    <ArrowRight size={22} />
                  </button>
                  <button
                    onClick={() => { setClarifyIndex((i) => Math.min(inboxTasks.length - 1, i + 1)); setClarifyStep(1); }}
                    disabled={clarifyIndex === inboxTasks.length - 1}
                    className="p-3 text-slate-400 dark:text-gray-500 disabled:opacity-30 active:bg-slate-100 dark:active:bg-gray-800 rounded-xl"
                    aria-label="הבא"
                  >
                    <ArrowLeft size={22} />
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
