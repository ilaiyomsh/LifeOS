import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { searchTasks } from '../../lib/localDb';
import { cn } from '../../lib/utils';
import { AREAS, STATUS_LABELS } from '../../lib/constants';

const STATUS_ORDER = ['inbox', 'next_action', 'waiting_for', 'someday', 'done'];

export default function SearchModal({ onClose, onSelectTask }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const results = useMemo(() => searchTasks(query), [query]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const task of results) {
      const s = task.status || 'inbox';
      if (!groups[s]) groups[s] = [];
      groups[s].push(task);
    }
    return STATUS_ORDER.filter((s) => groups[s]).map((s) => ({
      status: s, label: STATUS_LABELS[s] || s, tasks: groups[s],
    }));
  }, [results]);

  const highlightMatch = (text) => {
    if (!text || !query || query.length < 2) return text;
    const q = query.trim();
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx === -1) return text;
    return (<>{text.slice(0, idx)}<mark className="bg-amber-200 dark:bg-amber-700 rounded px-0.5">{text.slice(idx, idx + q.length)}</mark>{text.slice(idx + q.length)}</>);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-12 sm:pt-20 animate-fade-in">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md mx-4 shadow-xl max-h-[70vh] flex flex-col overflow-hidden animate-scale-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-gray-800">
          <Search size={18} className="text-slate-400 dark:text-gray-500 shrink-0" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 dark:placeholder:text-gray-500 dark:text-gray-100"
            placeholder="חיפוש משימות..." dir="rtl" />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 text-slate-400 dark:text-gray-500 active:text-slate-600">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {query.length < 2 ? (
            <p className="text-center text-sm text-slate-400 dark:text-gray-500 py-12">הקלד לפחות 2 תווים...</p>
          ) : results.length === 0 ? (
            <p className="text-center text-sm text-slate-400 dark:text-gray-500 py-12">לא נמצאו תוצאות</p>
          ) : (
            <div className="py-2">
              {grouped.map((group) => (
                <div key={group.status}>
                  <div className="px-4 py-1.5 text-[11px] font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wide">
                    {group.label} ({group.tasks.length})
                  </div>
                  {group.tasks.map((task) => {
                    const area = task.area ? AREAS[task.area] : null;
                    return (
                      <button key={task.id} onClick={() => { onSelectTask?.(task); onClose(); }}
                        className="w-full text-right px-4 py-2.5 active:bg-slate-50 dark:active:bg-gray-800 flex items-start gap-2 transition-colors touch-target">
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm dark:text-gray-200', task.status === 'done' && 'line-through text-slate-400 dark:text-gray-500')}>
                            {highlightMatch(task.title)}
                          </p>
                          {task.notes && <p className="text-[11px] text-slate-400 dark:text-gray-500 truncate mt-0.5">{highlightMatch(task.notes)}</p>}
                        </div>
                        {area && <span className={cn('text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5', area.lightBg, area.text)}>{area.label}</span>}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
