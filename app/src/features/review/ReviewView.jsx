import { useState, useMemo } from 'react';
import { RefreshCw, Inbox, FolderKanban, Clock, ArchiveX, Calendar, ChevronLeft, Check, AlertTriangle, BarChart3 } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { useProjects } from '../../hooks/useProjects';
import TaskItem from '../../components/ui/TaskItem';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';
import { cn, formatDateFull, getTaskStaleness } from '../../lib/utils';
import { AREAS } from '../../lib/constants';

const STEPS = [
  { id: 'inbox', label: 'עבד את תיבת הדואר', icon: Inbox, description: 'עבור על כל פריט שלא עובד' },
  { id: 'projects', label: 'סקור פרויקטים', icon: FolderKanban, description: 'ודא שלכל פרויקט יש פעולה הבאה' },
  { id: 'waiting', label: 'בדוק ממתינים', icon: Clock, description: 'עקוב אחרי דברים שממתינים' },
  { id: 'someday', label: 'סקור יום אחד/אולי', icon: ArchiveX, description: 'משהו להפעיל? משהו למחוק?' },
  { id: 'plan', label: 'תכנן את השבוע', icon: Calendar, description: 'הקצה משימות לימים הקרובים' },
  { id: 'metrics', label: 'מדדים ורפלקציה', icon: BarChart3, description: 'סקור את השבוע ותכנן שיפורים' },
];

export default function ReviewView() {
  const { tasks: allTasks, updateTask, deleteTask, completeTask } = useTasks({});
  const { projects, addProject } = useProjects({ is_active: true });
  const { addToast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [editingTask, setEditingTask] = useState(null);
  const [reflection, setReflection] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('lifeos_reflections') || '{}');
      const today = new Date().toISOString().split('T')[0];
      return saved.date === today ? saved : { start: '', stop: '', continue: '', date: today };
    } catch {
      return { start: '', stop: '', continue: '', date: new Date().toISOString().split('T')[0] };
    }
  });

  const inboxTasks = useMemo(() => allTasks.filter((t) => t.status === 'inbox'), [allTasks]);
  const waitingTasks = useMemo(() => allTasks.filter((t) => t.status === 'waiting_for'), [allTasks]);
  const somedayTasks = useMemo(() => allTasks.filter((t) => t.status === 'someday'), [allTasks]);
  const nextActions = useMemo(() => allTasks.filter((t) => t.status === 'next_action'), [allTasks]);

  // Weekly metrics
  const weeklyStats = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = allTasks.filter(
      (t) => t.status === 'done' && t.completed_at && new Date(t.completed_at) >= weekAgo
    );
    const totalMinutes = completedThisWeek.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
    const staleTasks = allTasks.filter((t) => getTaskStaleness(t).isStale);
    return {
      completed: completedThisWeek.length,
      totalMinutes,
      stale: staleTasks.length,
      inboxSize: inboxTasks.length,
    };
  }, [allTasks, inboxTasks]);

  const saveReflection = (field, value) => {
    const updated = { ...reflection, [field]: value };
    setReflection(updated);
    localStorage.setItem('lifeos_reflections', JSON.stringify(updated));
  };

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

  const handleConvertToProject = async (task) => {
    if (!task.area) { addToast('יש לבחור תחום לפני הפיכה לפרויקט'); return; }
    try {
      const project = await addProject({ title: task.title, area: task.area });
      await updateTask(task.id, { project_id: project.id, status: 'next_action' });
      setEditingTask(null);
      addToast('המשימה הפכה לפרויקט');
    } catch { addToast('שגיאה בהפיכה לפרויקט'); }
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
        <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">סקירה שבועית</h1>
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">6 צעדים לסדר מושלם</p>
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
                : i === currentStep ? 'bg-slate-900 dark:bg-blue-500'
                : 'bg-slate-200 dark:bg-gray-700'
            )}
            aria-label={s.label}
          />
        ))}
      </div>

      {allDone ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-1">סקירה הושלמה!</h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">המערכת מסודרת. אפשר להתחיל לעבוד.</p>
          <button
            onClick={() => { setCompletedSteps(new Set()); setCurrentStep(0); }}
            className="mt-6 px-6 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            סקירה חדשה
          </button>
        </div>
      ) : (
        <>
          {/* Current step header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-4">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-gray-700 flex items-center justify-center">
                <step.icon size={18} className="text-slate-600 dark:text-gray-300" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100">{step.label}</h2>
                <p className="text-xs text-slate-400 dark:text-gray-500">{step.description}</p>
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
                      <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl border border-amber-200 dark:border-amber-800 p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle size={14} className="text-amber-500" />
                          <span className="text-sm font-medium text-slate-800 dark:text-gray-200">{project.title}</span>
                          {area && (
                            <span className={cn('text-[11px] px-1.5 py-0.5 rounded', area.lightBg, area.text)}>
                              {area.label}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-amber-600 dark:text-amber-400">חסרה פעולה הבאה — מה הצעד הבא?</p>
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
                  <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 p-3 flex items-center gap-3">
                    <span className="flex-1 text-sm text-slate-700 dark:text-gray-300">{task.title}</span>
                    <button
                      onClick={() => handleActivate(task.id)}
                      className="text-xs px-3 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg active:bg-slate-800 dark:active:bg-blue-700"
                    >
                      הפעל
                    </button>
                    <button
                      onClick={() => handleTrash(task.id)}
                      className="text-xs px-3 py-2 text-red-500 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 rounded-lg"
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
                    <p className="text-xs text-slate-500 dark:text-gray-400">הקצה משימות לימים הקרובים:</p>
                    {nextActions.filter((t) => !t.scheduled_date).map((task) => (
                      <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 p-3">
                        <p className="text-sm text-slate-800 dark:text-gray-200 mb-2">{task.title}</p>
                        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
                          {weekDays.map((day) => (
                            <button
                              key={day}
                              onClick={() => handleSchedule(task.id, day)}
                              className="shrink-0 px-3 py-2 text-xs bg-slate-100 dark:bg-gray-700 active:bg-slate-200 dark:active:bg-gray-600 text-slate-600 dark:text-gray-300 rounded-lg transition-colors"
                            >
                              {formatDateFull(day).split(',')[0] || new Date(day).toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric' })}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    {nextActions.filter((t) => t.scheduled_date).length > 0 && (
                      <div className="mt-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-gray-400 mb-2">כבר מתוזמנים:</h3>
                        {nextActions.filter((t) => t.scheduled_date).map((task) => (
                          <TaskItem key={task.id} task={task} onEdit={setEditingTask} showArea />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Step 6: Metrics + Reflection */}
            {step.id === 'metrics' && (
              <div className="space-y-4">
                {/* Weekly stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 text-center">
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{weeklyStats.completed}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">משימות הושלמו</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weeklyStats.totalMinutes}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">דקות עבודה</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 text-center">
                    <p className={cn('text-2xl font-bold', weeklyStats.stale > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400 dark:text-gray-600')}>{weeklyStats.stale}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">משימות ישנות</p>
                  </div>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3 text-center">
                    <p className={cn('text-2xl font-bold', weeklyStats.inboxSize > 0 ? 'text-slate-800 dark:text-gray-200' : 'text-slate-400 dark:text-gray-600')}>{weeklyStats.inboxSize}</p>
                    <p className="text-[11px] text-slate-500 dark:text-gray-400">בתיבת דואר</p>
                  </div>
                </div>

                {/* Start / Stop / Continue */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-gray-300">רפלקציה שבועית</h3>
                  <div>
                    <label className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-1 block">להתחיל</label>
                    <textarea
                      value={reflection.start}
                      onChange={(e) => saveReflection('start', e.target.value)}
                      className="w-full text-sm bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-2 border border-emerald-200 dark:border-emerald-800 focus:outline-none focus:ring-1 focus:ring-emerald-300 dark:focus:ring-emerald-700 resize-none dark:text-gray-100"
                      placeholder="מה להתחיל לעשות?"
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-red-600 dark:text-red-400 mb-1 block">להפסיק</label>
                    <textarea
                      value={reflection.stop}
                      onChange={(e) => saveReflection('stop', e.target.value)}
                      className="w-full text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 border border-red-200 dark:border-red-800 focus:outline-none focus:ring-1 focus:ring-red-300 dark:focus:ring-red-700 resize-none dark:text-gray-100"
                      placeholder="מה לא עובד?"
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1 block">להמשיך</label>
                    <textarea
                      value={reflection.continue}
                      onChange={(e) => saveReflection('continue', e.target.value)}
                      className="w-full text-sm bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-2 border border-blue-200 dark:border-blue-800 focus:outline-none focus:ring-1 focus:ring-blue-300 dark:focus:ring-blue-700 resize-none dark:text-gray-100"
                      placeholder="מה עובד טוב?"
                      rows={2}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Step navigation */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2.5 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
              >
                הקודם
              </button>
            )}
            <button
              onClick={markStepDone}
              className="flex-1 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-semibold active:bg-slate-800 dark:active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
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
          onConvertToProject={handleConvertToProject}
        />
      )}
    </div>
  );
}
