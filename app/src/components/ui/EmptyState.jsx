import { cn } from '../../lib/utils';

export default function EmptyState({ icon: Icon, title, description, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-6 text-center', className)}>
      {Icon && (
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
          <Icon size={24} className="text-slate-400" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-slate-600 mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-[240px]">{description}</p>}
    </div>
  );
}
