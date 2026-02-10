import { useState, useMemo } from 'react';
import { RefreshCw, Inbox, FolderKanban, Clock, ArchiveX, Calendar, ChevronLeft, Check, AlertTriangle } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskItem from '../../components/ui/TaskItem';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';
import { cn, formatDateFull } from '../../lib/utils';
import { AREAS } from '../../lib/constants';

const STEPS = [
  { id: 'inbox', label: 'עבד את תיבת הדואר', icon: Inbox, description: 'עבור על כל פריט שלא עובד' },
  { id: 'projects', label: 'סקור פרויקטים', icon: FolderKanban, description: 'ודא שלכל פרויקט יש פעולה הבאה' },
  { id: 'waiting', label: 'בדוק ממתינים', icon: Clock, description: 'עקוב אחרי דברים שממתינים' },
  { id: 'someday', label: 'סקור יום אחד/אולי', icon: ArchiveX, description: 'משהו להפעיל? משהו למחוק?' },
  { id: 'plan', label: 'תכנן את השבוע', icon: Calendar, description: 'הקצה משימות לימים הקרובים' },
];

export default function ReviewView() {
  const { tasks: allTasks, updateTask, deleteTask, completeTask } = useTasks({});
  const { projects } = useProjects({ is_active: true });
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);

  const inboxTasks = useMemo(() => allTasks.filter((t) => t.status === 'inbox'), [allTasks]);
  const waitingTasks = useMemo(() => allTasks.filter((t) => t.status === 'waiting_for'), [allTasks]);
  const somedayTasks = useMemo(() => allTasks.filter((t) => t.status === 'someday'), [allTasks]);
  const nextActions = useMemo(() => allTasks.filter((t) => t.status === 'next_action'), [allTasks]);

  const projectsWithoutNextAction = useMemo(() => {
    return projects.filter((p) => {
      const projectTasks = allTasks.filter((t) => t.project_id === p.id && t.status === 'next_action');
      return projectTasks.length === 0;
    });
  }, [projects, allTasks]);

  const markStepDone = () => {
    setCompletedSteps((prev) => new Set(prev).add(STEPS[currentStep].id));
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const allDone = completedSteps.size === STEPS.length;

  const handleComplete = async (id) => {
    try {
      await completeTask(id);
      addToast('הושלם');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleActivate = async (id) => {
    try {
      await updateTask(id, { status: 'next_action' });
      addToast('הועבר לפעולות');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleTrash = async (id) => {
    try {
      await deleteTask(id);
      addToast('נמחק');
    } catch {
      addToast('שגיאה');
    }
  };

  const handleSchedule = async (id, date) => {
    try {
      await updateTask(id, { scheduled_date: date });
      addToast('תוזמן');
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

  // Generate next 7 days
  const weekDays = useMemo(() => {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const step = STEPS[currentStep];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">סקירה שבועית</h1>
        <p className="text-xs text-slate-400 mt-0.5">5 צעדים לסדר מושלם</p>
      </div>

      {/* Progress */}
      <div className="flex gap-1.5 mb-6">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setCurrentStep(i)}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-colors',
              completedSteps.has(s.id) ? 'bg-emerald-500'
                : i === currentStep ? 'bg-slate-900'
                : 'bg-slate-200'
            )}
            aria-label={s.label}
          />
        ))}
      </div>

      {allDone ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-1">סקירה הושלמה!</h2>
          <p className="text-sm text-slate-500">המערכת מסודרת. אפשר להתחיל לעבוד.</p>
          <button
            onClick={() => { setCompletedSteps(new Set()); setCurrentStep(0); }}
            className="mt-6 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold"
          >
            סקירה חדשה
          </button>
        </div>
      ) : (
        <>
          {/* Current step header */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <step.icon size={18} className="text-slate-600" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900">{step.label}</h2>
                <p className="text-xs text-slate-400">{step.description}</p>
              </div>
            </div>
          </div>

          {/* Step content */}
          <div className="space-y-2 mb-4">
            {/* Step 1: Inbox */}
            {step.id === 'inbox' && (
              inboxTasks.length === 0 ? (
                <EmptyState icon={Inbox} title="תיבת הדואר ריקה" description="אין מה לעבד. מצוין!" />
              ) : (
                inboxTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onEdit={setEditingTask} onDelete={handleTrash} />
                ))
              )
            )}

            {/* Step 2: Projects */}
            {step.id === 'projects' && (
              projectsWithoutNextAction.length === 0 ? (
                <EmptyState icon={FolderKanban} title="כל הפרויקטים תקינים" description="לכל פרויקט יש לפחות פעולה הבאה אחת." />
              ) : (
                <div className="space-y-2">
                  {projectsWithoutNextAction.map((project) => {
                    const area = AREAS[project.area];
                    return (
                      <div key={project.id} className="bg-white rounded-xl border border-amber-200 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="text-sm font-medium text-slate-800">{project.title}</span>
                          {area && (
                            <span className={cn('text-[11px] px-1.5 py-0.5 rounded', area.lightBg, area.text)}>
                              {area.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-600">חסרה פעולה הבאה — מה הצעד הבא?</p>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* Step 3: Waiting for */}
            {step.id === 'waiting' && (
              waitingTasks.length === 0 ? (
                <EmptyState icon={Clock} title="אין פריטים ממתינים" />
              ) : (
                waitingTasks.map((task) => (
                  <TaskItem key={task.id} task={task} onComplete={handleComplete} onEdit={setEditingTask} />
                ))
              )
            )}

            {/* Step 4: Someday/Maybe */}
            {step.id === 'someday' && (
              somedayTasks.length === 0 ? (
                <EmptyState icon={ArchiveX} title="רשימת יום אחד/אולי ריקה" />
              ) : (
                somedayTasks.map((task) => (
                  <div key={task.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate-700">{task.title}</span>
                    <button
                      onClick={() => handleActivate(task.id)}
                      className="text-xs px-3 py-2 bg-slate-900 text-white rounded-lg active:bg-slate-800"
                    >
                      הפעל
                    </button>
                    <button
                      onClick={() => handleTrash(task.id)}
                      className="text-xs px-3 py-2 text-red-500 active:bg-red-50 rounded-lg"
                    >
                      מחק
                    </button>
                  </div>
                ))
              )
            )}

            {/* Step 5: Plan the week */}
            {step.id === 'plan' && (
              <div className="space-y-3">
                {nextActions.length === 0 ? (
                  <EmptyState icon={Calendar} title="אין פעולות לתזמן" />
                ) : (
                  <>
                    <p className="text-xs text-slate-500">הקצה משימות לימים הקרובים:</p>
                    {nextActions.filter((t) => !t.scheduled_date).map((task) => (
                      <div key={task.id} className="bg-white rounded-xl border border-slate-100 p-3">
                        <p className="text-sm text-slate-800 mb-2">{task.title}</p>
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                          {weekDays.map((day) => (
                            <button
                              key={day}
                              onClick={() => handleSchedule(task.id, day)}
                              className="shrink-0 px-3 py-2 text-xs bg-slate-100 active:bg-slate-200 text-slate-600 rounded-lg transition-colors"
                            >
                              {formatDateFull(day).split(',')[0] || new Date(day).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' })}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {nextActions.filter((t) => t.scheduled_date).length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-semibold text-slate-500 mb-2">כבר מתוזמנים:</h3>
                        {nextActions.filter((t) => t.scheduled_date).map((task) => (
                          <TaskItem key={task.id} task={task} onEdit={setEditingTask} showArea />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Step navigation */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-700"
              >
                הקודם
              </button>
            )}
            <button
              onClick={markStepDone}
              className="flex-1 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold active:bg-slate-800 transition-colors flex items-center justify-center gap-2"
            >
              {currentStep === STEPS.length - 1 ? 'סיום סקירה' : 'הבא'}
              {currentStep < STEPS.length - 1 && <ChevronLeft size={16} />}
            </button>
          </div>
        </>
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
