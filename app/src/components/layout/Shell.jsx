import { useState } from 'react';
import { Inbox, ListChecks, FolderKanban, RefreshCw, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import SearchModal from '../ui/SearchModal';

const TABS = [
  { id: 'inbox', label: 'תיבת דואר', icon: Inbox },
  { id: 'actions', label: 'פעולות', icon: ListChecks },
  { id: 'projects', label: 'פרויקטים', icon: FolderKanban },
  { id: 'review', label: 'סקירה', icon: RefreshCw },
];

export default function Shell({ activeTab, onTabChange, onEditTask, children }) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      {/* Top search bar */}
      <div className="sticky top-0 z-40 bg-slate-50 px-4 pt-2 pb-1" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top, 0px))' }}>
        <button
          onClick={() => setShowSearch(true)}
          className="w-full flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-400 active:bg-slate-50 transition-colors"
        >
          <Search size={16} />
          <span>חיפוש משימות...</span>
        </button>
      </div>

      <main className="flex-1 overflow-y-auto pb-24">
        {children}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50 pb-safe"
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
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px] active:scale-95',
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-400 active:text-slate-600'
                )}
              >
                <TabIcon size={22} strokeWidth={isActive ? 2.5 : 1.5} />
                <span className={cn(
                  'text-[11px] leading-none',
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
