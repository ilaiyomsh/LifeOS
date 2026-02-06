import { Inbox, ListChecks, FolderKanban, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils';

const TABS = [
  { id: 'inbox', label: 'תיבת דואר', icon: Inbox },
  { id: 'actions', label: 'פעולות', icon: ListChecks },
  { id: 'projects', label: 'פרויקטים', icon: FolderKanban },
  { id: 'review', label: 'סקירה', icon: RefreshCw },
];

export default function Shell({ activeTab, onTabChange, children }) {
  return (
    <div className="flex flex-col h-dvh bg-slate-50">
      <main className="flex-1 overflow-y-auto pb-20">
        {children}
      </main>

      <nav
        className="fixed bottom-0 inset-x-0 bg-white border-t border-slate-200 z-50"
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
                  'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-colors min-w-[64px]',
                  isActive
                    ? 'text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
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
    </div>
  );
}
