import { useState, useCallback } from 'react';
import Shell from './components/layout/Shell';
import InboxView from './features/inbox/InboxView';
import ActionsView from './features/actions/ActionsView';
import ProjectsView from './features/projects/ProjectsView';
import ReviewView from './features/review/ReviewView';
import CalendarView from './features/calendar/CalendarView';
import HabitsView from './features/habits/HabitsView';
import SettingsView from './features/settings/SettingsView';
import OnboardingFlow from './features/onboarding/OnboardingFlow';
import EditTaskModal from './components/ui/EditTaskModal';
import { ToastProvider } from './components/ui/Toast';
import { ThemeProvider } from './lib/ThemeContext';
import { useToast } from './hooks/useToast';
import { useTasks } from './hooks/useTasks';
import { useProjects } from './hooks/useProjects';

function AppContent() {
  const [activeTab, setActiveTab] = useState('inbox');
  const [searchEditTask, setSearchEditTask] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(() => {
    return !localStorage.getItem('lifeos_onboarding_done');
  });
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

  if (showOnboarding) {
    return <OnboardingFlow onComplete={() => setShowOnboarding(false)} />;
  }

  const renderView = () => {
    switch (activeTab) {
      case 'inbox':
        return <InboxView />;
      case 'actions':
        return <ActionsView />;
      case 'calendar':
        return <CalendarView />;
      case 'projects':
        return <ProjectsView />;
      case 'review':
        return <ReviewView />;
      case 'habits':
        return <HabitsView />;
      case 'settings':
        return <SettingsView />;
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
    <ThemeProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ThemeProvider>
  );
}
