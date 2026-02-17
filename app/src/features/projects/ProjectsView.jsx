import { useState, useMemo } from 'react';
import { FolderKanban, Plus, ChevronDown, ChevronLeft, AlertTriangle, Check } from 'lucide-react';
import { useProjects } from '../../hooks/useProjects';
import { useTasks } from '../../hooks/useTasks';
import TaskItem from '../../components/ui/TaskItem';
import TaskInput from '../../components/ui/TaskInput';
import EditTaskModal from '../../components/ui/EditTaskModal';
import EmptyState from '../../components/ui/EmptyState';
import { useToast } from '../../hooks/useToast';
import { cn } from '../../lib/utils';
import { AREAS, AREA_LIST } from '../../lib/constants';

export default function ProjectsView() {
  const { projects, addProject, updateProject } = useProjects({ is_active: true });
  const { tasks, addTask, updateTask, deleteTask, completeTask } = useTasks({
    status: ['next_action', 'waiting_for', 'someday'],
  });
  const { addToast } = useToast();

  const [expandedProjects, setExpandedProjects] = useState(new Set());
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectArea, setNewProjectArea] = useState(null);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  const [editingTask, setEditingTask] = useState(null);

  // Group projects by area
  const projectsByArea = useMemo(() => {
    const grouped = {};
    for (const area of AREA_LIST) {
      grouped[area.id] = projects.filter((p) => p.area === area.id);
    }
    return grouped;
  }, [projects]);

  // Map tasks to projects
  const tasksByProject = useMemo(() => {
    const grouped = {};
    for (const task of tasks) {
      const pid = task.project_id || '_none';
      if (!grouped[pid]) grouped[pid] = [];
      grouped[pid].push(task);
    }
    return grouped;
  }, [tasks]);

  const toggleProject = (id) => {
    setExpandedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim() || !newProjectArea) return;

    try {
      const p = await addProject({ title: newProjectTitle.trim(), area: newProjectArea });
      setExpandedProjects((prev) => new Set(prev).add(p.id));
      setNewProjectTitle('');
      setShowNewProject(false);
      addToast('פרויקט נוצר');
    } catch {
      addToast('שגיאה ביצירת פרויקט');
    }
  };

  const handleComplete = async (id) => {
    const task = tasks.find((t) => t.id === id);
    try {
      await completeTask(id);
      addToast(`"${task?.title}" הושלמה!`, {
        action: { label: 'ביטול', onClick: () => updateTask(id, { status: 'next_action', completed_at: null }) },
      });
    } catch {
      addToast('שגיאה בהשלמה');
    }
  };

  const handleAddTaskToProject = async (projectId, area) => async ({ title }) => {
    try {
      await addTask({ title, status: 'next_action', project_id: projectId, area });
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

  const handleCompleteProject = async (id) => {
    try {
      await updateProject(id, { is_active: false });
      addToast('פרויקט הושלם');
    } catch {
      addToast('שגיאה');
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">פרויקטים</h1>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">מאורגנים לפי תחום</p>
        </div>
        <button
          onClick={() => setShowNewProject(!showNewProject)}
          className="p-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white active:bg-slate-800 dark:active:bg-blue-700 transition-colors"
          aria-label="פרויקט חדש"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* New project form */}
      {showNewProject && (
        <form onSubmit={handleCreateProject} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-4 space-y-3">
          <input
            type="text"
            value={newProjectTitle}
            onChange={(e) => setNewProjectTitle(e.target.value)}
            placeholder="שם הפרויקט"
            className="w-full text-sm border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-gray-600 dark:text-gray-100"
            dir="rtl"
            autoFocus
          />
          <div className="flex gap-2">
            {AREA_LIST.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setNewProjectArea(a.id)}
                className={cn(
                  'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                  newProjectArea === a.id
                    ? `${a.lightBg} ${a.text} ${a.border}`
                    : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!newProjectTitle.trim() || !newProjectArea}
              className="flex-1 bg-slate-900 dark:bg-blue-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-40"
            >
              צור פרויקט
            </button>
            <button
              type="button"
              onClick={() => setShowNewProject(false)}
              className="px-4 py-2 text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="אין פרויקטים"
          description="פרויקט הוא כל מטרה שדורשת יותר מצעד אחד. צור פרויקט ראשון."
        />
      ) : (
        <div className="space-y-6">
          {AREA_LIST.map((area) => {
            const areaProjects = projectsByArea[area.id];
            if (areaProjects.length === 0) return null;

            return (
              <section key={area.id}>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-gray-100 mb-3 flex items-center gap-1.5">
                  <span className={cn('w-2.5 h-2.5 rounded-full', area.dot)} />
                  {area.label}
                  <span className="text-slate-400 dark:text-gray-500 font-normal">({areaProjects.length})</span>
                </h2>

                <div className="space-y-2">
                  {areaProjects.map((project) => {
                    const projectTasks = tasksByProject[project.id] || [];
                    const isExpanded = expandedProjects.has(project.id);
                    const hasNextAction = projectTasks.some((t) => t.status === 'next_action');

                    return (
                      <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700 overflow-hidden">
                        {/* Project header */}
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="w-full flex items-center gap-3 px-4 py-3 active:bg-slate-50 dark:active:bg-gray-750 transition-colors"
                        >
                          {isExpanded ? (
                            <ChevronDown size={16} className="text-slate-400 dark:text-gray-500 shrink-0" />
                          ) : (
                            <ChevronLeft size={16} className="text-slate-400 dark:text-gray-500 shrink-0" />
                          )}
                          <span className="flex-1 text-sm font-medium text-slate-800 dark:text-gray-200 text-right">
                            {project.title}
                          </span>

                          {/* Warnings & info */}
                          <div className="flex items-center gap-2 shrink-0">
                            {!hasNextAction && projectTasks.length > 0 && (
                              <span className="text-amber-500" title="אין פעולה הבאה">
                                <AlertTriangle size={14} />
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400 dark:text-gray-500">
                              {projectTasks.length} משימות
                            </span>
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-gray-700 px-4 py-3 space-y-2">
                            {projectTasks.length === 0 ? (
                              <p className="text-xs text-slate-400 dark:text-gray-500 text-center py-2">אין משימות בפרויקט</p>
                            ) : (
                              projectTasks.map((task) => (
                                <TaskItem
                                  key={task.id}
                                  task={task}
                                  onComplete={handleComplete}
                                  onDelete={(id) => deleteTask(id)}
                                  onEdit={setEditingTask}
                                  showArea={false}
                                />
                              ))
                            )}

                            <TaskInput
                              onAdd={handleAddTaskToProject(project.id, project.area)}
                              placeholder="משימה חדשה בפרויקט..."
                              area={project.area}
                            />

                            <button
                              onClick={() => handleCompleteProject(project.id)}
                              className="w-full py-2 text-xs text-slate-400 dark:text-gray-500 active:text-emerald-600 dark:active:text-emerald-400 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} />
                              סיים פרויקט
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
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
