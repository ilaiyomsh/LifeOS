import { memo, useState } from 'react';
import { Check, Clock, AlertCircle, MoreHorizontal, Trash2, CalendarDays, Hourglass, Repeat } from 'lucide-react';
import { cn, formatDate, isOverdue, getTaskStaleness } from '../../lib/utils';
import { AREAS, PRIORITY_COLORS } from '../../lib/constants';

const TaskItem = memo(function TaskItem({ task, onComplete, onDelete, onEdit, showArea = true }) {
  const [showMenu, setShowMenu] = useState(false);

  const area = task.area ? AREAS[task.area] : null;
  const overdue = isOverdue(task.due_date) && task.status !== 'done';
  const staleness = getTaskStaleness(task);

  return (
    <div className={cn(
      'group bg-white dark:bg-gray-800 rounded-xl border transition-all animate-fade-in',
      overdue ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-slate-100 dark:border-gray-700 active:bg-slate-50 dark:active:bg-gray-750'
    )}>
      <div className="flex items-start gap-3 px-4 py-3">
        {onComplete && task.status !== 'done' && (
          <button
            onClick={() => onComplete(task.id)}
            className="mt-0.5 shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all touch-target active:scale-90 border-slate-300 dark:border-gray-600 active:border-emerald-500 active:bg-emerald-50 dark:active:bg-emerald-900/20"
            aria-label={`סמן "${task.title}" כהושלם`}
          >
            <Check size={12} className="text-emerald-500 opacity-0" />
          </button>
        )}

        {task.status === 'done' && (
          <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check size={12} className="text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0" onClick={() => onEdit?.(task)} role={onEdit ? 'button' : undefined} tabIndex={onEdit ? 0 : undefined}>
          <p className={cn('text-sm leading-snug', task.status === 'done' ? 'line-through text-slate-400 dark:text-gray-500' : 'text-slate-800 dark:text-gray-200')}>
            {task.title}
          </p>

          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {showArea && area && (
              <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', area.lightBg, area.text)}>{area.label}</span>
            )}
            {task.priority && (
              <span className={cn('text-[11px]', PRIORITY_COLORS[task.priority])}>
                {task.priority === 'high' ? '! גבוהה' : task.priority === 'medium' ? '– בינונית' : '· נמוכה'}
              </span>
            )}
            {task.due_date && (
              <span className={cn('text-[11px] flex items-center gap-0.5', overdue ? 'text-red-600 dark:text-red-400 font-medium' : 'text-slate-400 dark:text-gray-500')}>
                <CalendarDays size={11} />{formatDate(task.due_date)}
              </span>
            )}
            {task.estimated_minutes && (
              <span className="text-[11px] text-slate-400 dark:text-gray-500 flex items-center gap-0.5">
                <Hourglass size={11} />{task.estimated_minutes} דק׳
              </span>
            )}
            {task.recurring_rule && (
              <span className="text-[11px] text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5"><Repeat size={11} />חוזרת</span>
            )}
            {task.waiting_on && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5"><Clock size={11} />ממתין: {task.waiting_on}</span>
            )}
            {staleness.isStale && (
              <span className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <AlertCircle size={11} />{staleness.label}
              </span>
            )}
            {task.tags?.length > 0 && task.tags.map((tag) => (
              <span key={tag} className="text-[10px] text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-1.5 py-0.5 rounded">{tag}</span>
            ))}
          </div>
        </div>

        {(onDelete || onEdit) && (
          <div className="relative shrink-0">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 -m-1 text-slate-300 dark:text-gray-600 active:text-slate-500 dark:active:text-gray-400 rounded transition-colors touch-target"
              aria-label="אפשרויות"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute left-0 top-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-slate-200 dark:border-gray-700 py-1 z-50 min-w-[120px]">
                  {onEdit && (
                    <button onClick={() => { onEdit(task); setShowMenu(false); }} className="w-full text-right px-4 py-2.5 text-sm text-slate-700 dark:text-gray-200 active:bg-slate-50 dark:active:bg-gray-700">
                      עריכה
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => { onDelete(task.id); setShowMenu(false); }} className="w-full text-right px-4 py-2.5 text-sm text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-900/20 flex items-center gap-2">
                      <Trash2 size={14} />מחיקה
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

    </div>
  );
});

export default TaskItem;
