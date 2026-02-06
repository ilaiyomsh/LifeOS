import { useState, useCallback } from 'react';
import Shell from './components/layout/Shell';
import InboxView from './features/inbox/InboxView';
import ActionsView from './features/actions/ActionsView';
import ProjectsView from './features/projects/ProjectsView';
import ReviewView from './features/review/ReviewView';
import { ToastProvider } from './components/ui/Toast';

export default function App() {
  const [activeTab, setActiveTab] = useState('inbox');

  const renderView = useCallback(() => {
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
  }, [activeTab]);

  return (
    <ToastProvider>
      <Shell activeTab={activeTab} onTabChange={setActiveTab}>
        {renderView()}
      </Shell>
    </ToastProvider>
  );
}
