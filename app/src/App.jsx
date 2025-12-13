import React, { useState } from 'react';
import { TaskProvider } from './contexts/TaskContext';
import { GameProvider } from './contexts/GameContext';
import { Shell } from './components/layout/Shell';

// Lazy load features later, for now import directly
import { PlanningFeature } from './features/planning/PlanningFeature';
import { CalendarFeature } from './features/calendar/CalendarFeature';
import { FocusFeature } from './features/focus/FocusFeature';
import { ReviewFeature } from './features/review/ReviewFeature';
import { HistoryFeature } from './features/review/HistoryFeature';
import { ScheduleFeature } from './features/schedule/ScheduleFeature';

function App() {
  const [activeTab, setActiveTab] = useState('plan');

  const renderView = () => {
    switch (activeTab) {
      case 'plan': return <PlanningFeature />;
      case 'calendar': return <CalendarFeature />;
      case 'schedule': return <ScheduleFeature />;
      case 'execute': return <FocusFeature />;
      case 'review': return <ReviewFeature />;
      case 'history': return <HistoryFeature />;
      default: return <PlanningFeature />;
    }
  };

  return (
    <GameProvider>
      <TaskProvider>
        <Shell activeTab={activeTab} onTabChange={setActiveTab}>
          {renderView()}
        </Shell>
      </TaskProvider>
    </GameProvider>
  );
}

export default App;
