import { useState } from 'react';
import { Inbox, ListChecks, Calendar, FolderKanban, RefreshCw, Search, Settings, Flame } from 'lucide-react';
import { cn } from '../../lib/utils';
import SearchModal from '../ui/SearchModal';

const TABS = [
  { id: 'inbox', label: 'דואר', icon: Inbox },
  { id: 'actions', label: 'פעולות', icon: ListChecks },
  { id: 'calendar', label: 'לוח שנה', icon: Calendar },
  { id: 'projects', label: 'פרויקטים', icon: FolderKanban },
  { id: 'review', label: 'סקירה', icon: RefreshCw },
];

const MORE_TABS = [
  { id: 'habits', label: 'הרגלים', icon: Flame },
  { id: 'settings', label: 'הגדרות', icon: Settings },
];

export default function Shell({ activeTab, onTabChange, onEditTask, children }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex flex-col h-dvh bg-slate-50 dark:bg-gray-950">
      {/* Top search bar */}
      <div className="sticky top-0 z-40 bg-slate-50 dark:bg-gray-950 px-4 pt-2 pb-1" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-xl text-sm text-slate-400 dark:text-gray-500 active:bg-slate-50 dark:active:bg-gray-700 transition-colors"
          >
            <Search size={16} />
            <span>חיפוש משימות...</span>
          </button>
          {MORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'p-2.5 rounded-xl transition-colors touch-target',
                  isActive
                    ? 'bg-slate-900 dark:bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-slate-400 dark:text-gray-500 border border-slate-200 dark:border-gray-700 active:bg-slate-100 dark:active:bg-gray-700'
                )}
                aria-label={tab.label}
              >
                <Icon size={16} />
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 bg-white dark:bg-gray-900 border-t border-slate-200 dark:border-gray-800 z-50 pb-safe"
        role="tablist"
        aria-label="ניווט ראשי"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto h-16 px-2">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-label={tab.label}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all min-w-[56px] active:scale-95 touch-target',
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-400 dark:text-gray-500 active:text-slate-600 dark:active:text-gray-300'
                )}
              >
                <TabIcon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn(
                  'text-[10px] leading-none',
                  isActive ? 'font-semibold' : 'font-normal'
                )}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {showSearch && (
        <SearchModal
          onClose={() => setShowSearch(false)}
          onSelectTask={(task) => {
            onEditTask?.(task);
            setShowSearch(false);
          }}
        />
      )}
    </div>
  );
}
