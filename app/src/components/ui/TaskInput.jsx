import { useState } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function TaskInput({ onAdd, placeholder = 'מה צריך לעשות?', area = null, className }) {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const title = text.trim();
    if (!title || submitting) return;

    setSubmitting(true);
    try {
      await onAdd({ title, area });
      setText('');
    } catch {
      // Error handled by caller
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      <div className="relative flex-1">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm',
            'placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300',
            'transition-shadow'
          )}
          dir="rtl"
          disabled={submitting}
        />
      </div>
      <button
        type="submit"
        disabled={!text.trim() || submitting}
        className={cn(
          'shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors',
          text.trim()
            ? 'bg-slate-900 text-white hover:bg-slate-800'
            : 'bg-slate-100 text-slate-300'
        )}
        aria-label="הוסף משימה"
      >
        <Plus size={20} />
      </button>
    </form>
  );
}
