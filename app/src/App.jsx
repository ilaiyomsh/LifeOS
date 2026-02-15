import { useState, useCallback } from 'react';
import Shell from './components/layout/Shell';
import InboxView from './features/inbox/InboxView';
import ActionsView from './features/actions/ActionsView';
import ProjectsView from './features/projects/ProjectsView';
import ReviewView from './features/review/ReviewView';
import EditTaskModal from './components/ui/EditTaskModal';
import { ToastProvider } from './components/ui/Toast';
import { useToast } from './hooks/useToast';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';

function AppContent() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchEditTask, setSearchEditTask] = useState(null);
  const { updateTask } = useTasks({});
  const { projects } = useProjects({ is_active: true });
  const { addToast } = useToast();

  const handleSearchEditSave = useCallback(async (id, updates) => {
    try {
      await updateTask(id, updates);
      setSearchEditTask(null);
      addToast('משימה עודכנה');
    } catch {
      addToast('שגיאה בשמירה');
    }
  }, [updateTask, addToast]);

  const renderView = () => {
    switch (activeTab) {
      case 'inbox':
        return <InboxView />;
      case 'actions':
        return <ActionsView />;
      case 'projects':
        return <ProjectsView />;
      case 'review':
        return <ReviewView />;
      default:
        return <InboxView />;
    }
  };

  return (
    <Shell activeTab={activeTab} onTabChange={setActiveTab} onEditTask={setSearchEditTask}>
      {renderView()}
      {searchEditTask && (
        <EditTaskModal
          task={searchEditTask}
          projects={projects}
          onSave={handleSearchEditSave}
          onClose={() => setSearchEditTask(null)}
        />
      )}
    </Shell>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}
