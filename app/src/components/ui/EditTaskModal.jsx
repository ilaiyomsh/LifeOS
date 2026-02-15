import { useState, useEffect } from 'react';
import { X, Star, Plus, Trash2, Check, Repeat } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AREA_LIST, PRIORITY_LABELS } from '../../lib/constants';
import * as localDb from '../../lib/localDb';

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

export default function EditTaskModal({ task, projects = [], onSave, onClose }) {
  const [form, setForm] = useState(() => buildFormFromTask(task));
  const [subtasks, setSubtasks] = useState([]);
  const [newSubtask, setNewSubtask] = useState('');
  const [newTag, setNewTag] = useState('');

  // Load subtasks
  useEffect(() => {
    if (task?.id) {
      setSubtasks(localDb.getSubtasks(task.id));
    }
  }, [task?.id]);

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

  const handleAddSubtask = () => {
    if (!newSubtask.trim()) return;
    const sub = localDb.addSubtask(task.id, newSubtask.trim());
    setSubtasks([...subtasks, sub]);
    setNewSubtask('');
  };

  const handleToggleSubtask = (id, isDone) => {
    localDb.updateSubtask(id, { is_done: !isDone });
    setSubtasks(subtasks.map((s) => s.id === id ? { ...s, is_done: !isDone } : s));
  };

  const handleDeleteSubtask = (id) => {
    localDb.deleteSubtask(id);
    setSubtasks(subtasks.filter((s) => s.id !== id));
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

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold">עריכת משימה</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 active:text-slate-600 rounded-lg" aria-label="סגור">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 pb-8 space-y-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
          {/* Title */}
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full text-base font-medium bg-transparent border-0 border-b border-slate-200 pb-2 focus:outline-none focus:border-slate-400"
            placeholder="שם המשימה"
            dir="rtl"
            autoFocus
          />

          {/* Notes */}
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300 resize-none"
            placeholder="הערות..."
            rows={2}
            dir="rtl"
          />

          {/* Subtasks */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">משימות משנה</label>
            <div className="space-y-1 mb-2">
              {subtasks.map((sub) => (
                <div key={sub.id} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(sub.id, sub.is_done)}
                    className={cn(
                      'w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors',
                      sub.is_done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 active:border-emerald-400'
                    )}
                  >
                    {sub.is_done && <Check size={12} className="text-white" />}
                  </button>
                  <span className={cn('flex-1 text-sm', sub.is_done && 'line-through text-slate-400')}>{sub.title}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(sub.id)}
                    className="p-1 text-slate-300 active:text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                className="flex-1 text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
                placeholder="הוסף משימת משנה..."
                dir="rtl"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg active:bg-slate-200"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Area */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">תחום</label>
            <div className="flex gap-2">
              {AREA_LIST.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setForm({ ...form, area: form.area === a.id ? null : a.id, project_id: null })}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    form.area === a.id
                      ? `${a.lightBg} ${a.text} ${a.border}`
                      : 'bg-white border-slate-200 text-slate-500 active:border-slate-300'
                  )}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">עדיפות</label>
            <div className="flex gap-2">
              {Object.entries(PRIORITY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setForm({ ...form, priority: form.priority === key ? null : key })}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    form.priority === key
                      ? key === 'high' ? 'bg-red-50 text-red-700 border-red-200'
                        : key === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                      : 'bg-white border-slate-200 text-slate-500 active:border-slate-300'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Focus toggle */}
          {form.status === 'next_action' && (
            <div>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_focus: !form.is_focus })}
                className={cn(
                  'w-full flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors active:opacity-80',
                  form.is_focus
                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                    : 'bg-white border-slate-200 text-slate-500'
                )}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Star size={16} className={form.is_focus ? 'fill-amber-500' : ''} />
                  משימת מיקוד
                </span>
                <span className="text-xs">{form.is_focus ? 'פעיל' : 'כבוי'}</span>
              </button>
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">תגיות</label>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {form.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 text-xs text-violet-700 bg-violet-50 px-2 py-1 rounded-lg">
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="text-violet-400 active:text-violet-700">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-1 text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
                placeholder="הוסף תגית..."
                dir="rtl"
              />
              <button type="button" onClick={handleAddTag} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg active:bg-slate-200">
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block flex items-center gap-1">
              <Repeat size={12} />
              חזרה
            </label>
            <div className="flex gap-2">
              {RECURRING_OPTIONS.map((opt) => (
                <button
                  key={opt.value || 'none'}
                  type="button"
                  onClick={() => setForm({ ...form, recurring_rule: opt.value ? { frequency: opt.value } : null })}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                    form.recurring_rule?.frequency === opt.value || (!form.recurring_rule && !opt.value)
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'bg-white border-slate-200 text-slate-500 active:border-slate-300'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Project */}
          {filteredProjects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">פרויקט</label>
              <select
                value={form.project_id || ''}
                onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
                dir="rtl"
              >
                <option value="">ללא פרויקט</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">סטטוס</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
              dir="rtl"
            >
              <option value="inbox">תיבת דואר</option>
              <option value="next_action">פעולה הבאה</option>
              <option value="waiting_for">ממתין ל...</option>
              <option value="someday">יום אחד/אולי</option>
            </select>
          </div>

          {/* Waiting on (conditional) */}
          {form.status === 'waiting_for' && (
            <input
              type="text"
              value={form.waiting_on}
              onChange={(e) => setForm({ ...form, waiting_on: e.target.value })}
              className="w-full text-sm bg-slate-50 rounded-lg px-3 py-2.5 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
              placeholder="ממתין למי/למה?"
              dir="rtl"
            />
          )}

          {/* Dates row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">תאריך יעד</label>
              <input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">מתוכנן ליום</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1.5 block">זמן משוער (דקות)</label>
            <input
              type="number"
              value={form.estimated_minutes}
              onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })}
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-300"
              placeholder="30"
              min="1"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-semibold active:bg-slate-800 transition-colors"
          >
            שמור
          </button>
        </form>
      </div>
    </div>
  );
}
