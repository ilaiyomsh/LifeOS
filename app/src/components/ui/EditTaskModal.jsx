import { useState, useEffect } from 'react';
import { X, Star, Plus, FolderKanban, Repeat } from 'lucide-react';
import { cn, lockBodyScroll, unlockBodyScroll } from '../../lib/utils';
import { AREA_LIST, PRIORITY_LABELS } from '../../lib/constants';

const RECURRING_OPTIONS = [
  { value: null, label: 'ללא' },
  { value: 'daily', label: 'יומי' },
  { value: 'weekly', label: 'שבועי' },
  { value: 'monthly', label: 'חודשי' },
];

function buildFormFromTask(task) {
  return {
    title: task?.title || '',
    notes: task?.notes || '',
    area: task?.area || null,
    priority: task?.priority || null,
    project_id: task?.project_id || null,
    due_date: task?.due_date || '',
    scheduled_date: task?.scheduled_date || '',
    estimated_minutes: task?.estimated_minutes || '',
    status: task?.status || 'inbox',
    waiting_on: task?.waiting_on || '',
    is_focus: task?.is_focus || false,
    tags: task?.tags || [],
    recurring_rule: task?.recurring_rule || null,
  };
}

export default function EditTaskModal({ task, projects = [], onSave, onClose, onConvertToProject }) {
  const [form, setForm] = useState(() => buildFormFromTask(task));
  const [newTag, setNewTag] = useState('');

  useEffect(() => { lockBodyScroll(); return unlockBodyScroll; }, []);

  if (!task) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const updates = {
      ...form,
      title: form.title.trim(),
      notes: form.notes.trim() || null,
      estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes, 10) : null,
      due_date: form.due_date || null,
      scheduled_date: form.scheduled_date || null,
      waiting_on: form.waiting_on.trim() || null,
    };
    onSave(task.id, updates);
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (!tag || form.tags.includes(tag)) return;
    setForm({ ...form, tags: [...form.tags, tag] });
    setNewTag('');
  };

  const handleRemoveTag = (tag) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const filteredProjects = projects.filter((p) => !form.area || p.area === form.area);

  const inputClass = 'w-full text-sm bg-slate-50 dark:bg-gray-900 rounded-lg px-3 py-2.5 border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-1 focus:ring-slate-300 dark:focus:ring-gray-600 dark:text-gray-100';
  const labelClass = 'text-xs font-medium text-slate-500 dark:text-gray-400 mb-1.5 block';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl animate-slide-up">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-slate-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold text-slate-900 dark:text-gray-100">עריכת משימה</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 dark:text-gray-500 active:text-slate-600 dark:active:text-gray-300 rounded-lg touch-target" aria-label="סגור">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full text-base font-medium bg-transparent border-0 border-b border-slate-200 dark:border-gray-700 pb-2 focus:outline-none focus:border-slate-400 dark:focus:border-gray-500 dark:text-gray-100"
            placeholder="שם המשימה" dir="rtl" autoFocus />

          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className={inputClass} placeholder="הערות..." rows={2} dir="rtl" />

          {/* Area */}
          <div>
            <label className={labelClass}>תחום</label>
            <div className="flex gap-2">
              {AREA_LIST.map((a) => (
                <button key={a.id} type="button" onClick={() => setForm({ ...form, area: form.area === a.id ? null : a.id, project_id: null })}
                  className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors touch-target',
                    form.area === a.id ? `${a.lightBg} ${a.text} ${a.border}` : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 active:border-slate-300')}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className={labelClass}>עדיפות</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <button key={key} type="button" onClick={() => setForm({ ...form, priority: form.priority === key ? null : key })}
                  className={cn('flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors touch-target',
                    form.priority === key
                      ? key === 'high' ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'
                        : key === 'medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-gray-700 text-slate-600 dark:text-gray-300 border-slate-300 dark:border-gray-600'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 active:border-slate-300')}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus toggle */}
          {form.status === 'next_action' && (
            <button type="button" onClick={() => setForm({ ...form, is_focus: !form.is_focus })}
              className={cn('w-full flex items-center justify-between py-3 px-3 rounded-lg border transition-colors active:opacity-80 touch-target',
                form.is_focus ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                  : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400')}>
              <span className="flex items-center gap-2 text-sm font-medium">
                <Star size={16} className={form.is_focus ? 'fill-amber-500' : ''} />משימת מיקוד
              </span>
              <span className="text-xs">{form.is_focus ? 'פעיל' : 'כבוי'}</span>
            </button>
          )}

          {/* Tags */}
          <div>
            <label className={labelClass}>תגיות</label>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-1 rounded-lg">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-violet-400 dark:text-violet-500 active:text-violet-700">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={newTag} onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className={inputClass} placeholder="הוסף תגית..." dir="rtl" />
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300 rounded-lg active:bg-slate-200 dark:active:bg-gray-700 touch-target">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className={cn(labelClass, 'flex items-center gap-1')}><Repeat size={12} />חזרה</label>
            <div className="flex gap-2">
              {RECURRING_OPTIONS.map((opt) => (
                <button key={opt.value || 'none'} type="button"
                  onClick={() => setForm({ ...form, recurring_rule: opt.value ? { frequency: opt.value } : null })}
                  className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-colors touch-target',
                    form.recurring_rule?.frequency === opt.value || (!form.recurring_rule && !opt.value)
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                      : 'bg-white dark:bg-gray-800 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400 active:border-slate-300')}>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          {filteredProjects.length > 0 && (
            <div>
              <label className={labelClass}>פרויקט</label>
              <select value={form.project_id || ''} onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
                className={inputClass} dir="rtl">
                <option value="">ללא פרויקט</option>
                {filteredProjects.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className={labelClass}>סטטוס</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass} dir="rtl">
              <option value="inbox">תיבת דואר</option>
              <option value="next_action">פעולה הבאה</option>
              <option value="waiting_for">ממתין ל...</option>
              <option value="someday">יום אחד/אולי</option>
            </select>
          </div>

          {form.status === 'waiting_for' && (
            <input type="text" value={form.waiting_on} onChange={(e) => setForm({ ...form, waiting_on: e.target.value })}
              className={inputClass} placeholder="ממתין למי/למה?" dir="rtl" />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>תאריך יעד</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>מתוכנן ליום</label>
              <input type="date" value={form.scheduled_date} onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })} className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>זמן משוער (דקות)</label>
            <input type="number" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
              className={inputClass} placeholder="30" min="1" />
          </div>

          <button type="submit" className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-xl py-3 text-sm font-semibold active:opacity-80 transition-colors touch-target">
            שמור
          </button>

          {onConvertToProject && (
            <button
              type="button"
              onClick={() => onConvertToProject(task)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800 rounded-xl active:bg-violet-100 dark:active:bg-violet-900/30 transition-colors touch-target"
            >
              <FolderKanban size={16} />
              הפוך לפרויקט
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
