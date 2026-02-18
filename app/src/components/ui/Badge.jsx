import { cn } from '../../lib/utils';

export default function Badge({ count, className }) {
  if (!count || count <= 0) return null;

  return (
    <span className={cn(
      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold',
      'bg-slate-900 dark:bg-blue-600 text-white',
      className
    )}>
      {count > 99 ? '99+' : count}
    </span>
  );
}
