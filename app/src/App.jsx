import React, { useState } from 'react';
import { SettingsProvider } from './contexts/SettingsContext';
import { TaskProvider } from './contexts/TaskContext';
import { GameProvider } from './contexts/GameContext';
import { Shell } from './components/layout/Shell';

// Lazy load features later, for now import directly
import { InboxFeature } from './features/inbox/InboxFeature';
import { PlanningFeature } from './features/planning/PlanningFeature';
import { CalendarFeature } from './features/calendar/CalendarFeature';
import { FocusFeature } from './features/focus/FocusFeature';
import { ReviewFeature } from './features/review/ReviewFeature';
import { HistoryFeature } from './features/review/HistoryFeature';
import { ScheduleFeature } from './features/schedule/ScheduleFeature';

function App() {
  const [activeTab, setActiveTab] = useState('inbox');

  const renderView = () => {
    switch (activeTab) {
      case 'inbox': return <InboxFeature />;
      case 'plan': return <PlanningFeature />;
      case 'calendar': return <CalendarFeature />;
      case 'schedule': return <ScheduleFeature />;
      case 'execute': return <FocusFeature />;
      case 'review': return <ReviewFeature />;
      case 'history': return <HistoryFeature />;
      default: return <InboxFeature />;
    }
  };

  return (
    <SettingsProvider>
      <GameProvider>
        <TaskProvider>
          <Shell activeTab={activeTab} onTabChange={setActiveTab}>
            {renderView()}
          </Shell>
        </TaskProvider>
      </GameProvider>
    </SettingsProvider>
  );
}

export default App;
