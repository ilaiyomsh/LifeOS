import { Check, Clock, AlertCircle, MoreHorizontal, Trash2, CalendarDays, Hourglass } from 'lucide-react';
import { cn, formatDate, isOverdue } from '../../lib/utils';
import { AREAS, PRIORITY_COLORS } from '../../lib/constants';
import { useState, useRef } from 'react';

export default function TaskItem({ task, onComplete, onDelete, onEdit, showArea = true }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  const area = task.area ? AREAS[task.area] : null;
  const overdue = isOverdue(task.due_date) && task.status !== 'done';

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-4 py-3 bg-white rounded-xl border transition-colors',
        overdue ? 'border-red-200 bg-red-50/50' : 'border-slate-100 active:bg-slate-50'
      )}
    >
      {/* Checkbox */}
      {onComplete && task.status !== 'done' && (
        <button
          onClick={() => onComplete(task.id)}
          className={cn(
            'mt-0.5 shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors',
            'border-slate-300 active:border-emerald-500 active:bg-emerald-50'
          )}
          aria-label={`סמן "${task.title}" כהושלם`}
        >
          <Check size={12} className="text-emerald-500 opacity-0" />
        </button>
      )}

      {task.status === 'done' && (
        <div className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center">
          <Check size={12} className="text-white" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0" onClick={() => onEdit?.(task)} role={onEdit ? 'button' : undefined} tabIndex={onEdit ? 0 : undefined}>
        <p className={cn(
          'text-sm leading-snug',
          task.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800'
        )}>
          {task.title}
        </p>

        <div className="flex items-center gap-2 mt-1 flex-wrap">
          {showArea && area && (
            <span className={cn('text-[11px] font-medium px-1.5 py-0.5 rounded', area.lightBg, area.text)}>
              {area.label}
            </span>
          )}

          {task.priority && (
            <span className={cn('text-[11px]', PRIORITY_COLORS[task.priority])}>
              {task.priority === 'high' ? '!' : task.priority === 'medium' ? '–' : '·'}{' '}
              {task.priority === 'high' ? 'גבוהה' : task.priority === 'medium' ? 'בינונית' : 'נמוכה'}
            </span>
          )}

          {task.due_date && (
            <span className={cn('text-[11px] flex items-center gap-0.5', overdue ? 'text-red-600 font-medium' : 'text-slate-400')}>
              <CalendarDays size={11} />
              {formatDate(task.due_date)}
            </span>
          )}

          {task.estimated_minutes && (
            <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
              <Hourglass size={11} />
              {task.estimated_minutes} דק׳
            </span>
          )}

          {task.waiting_on && (
            <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
              <Clock size={11} />
              ממתין: {task.waiting_on}
            </span>
          )}
        </div>
      </div>

      {/* Actions menu */}
      {(onDelete || onEdit) && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 -m-1 text-slate-300 active:text-slate-500 rounded transition-colors"
            aria-label="אפשרויות"
          >
            <MoreHorizontal size={18} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
              <div className="absolute left-0 top-10 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[120px]">
                {onEdit && (
                  <button
                    onClick={() => { onEdit(task); setShowMenu(false); }}
                    className="w-full text-right px-4 py-2.5 text-sm text-slate-700 active:bg-slate-50"
                  >
                    עריכה
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="w-full text-right px-4 py-2.5 text-sm text-red-600 active:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 size={14} />
                    מחיקה
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
