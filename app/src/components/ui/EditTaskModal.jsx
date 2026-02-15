import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { cn } from '../../lib/utils';
import { AREA_LIST, PRIORITY_LABELS } from '../../lib/constants';

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
  };
}

export default function EditTaskModal({ task, projects = [], onSave, onClose }) {
  const [form, setForm] = useState(() => buildFormFromTask(task));

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

  const filteredProjects = projects.filter((p) => !form.area || p.area === form.area);

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between rounded-t-2xl z-10">
          <h2 className="text-base font-semibold">עריכת משימה</h2>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg" aria-label="סגור">
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
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
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
                      : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
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
                  'w-full flex items-center justify-between py-2.5 px-3 rounded-lg border transition-colors',
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

          {/* Project */}
          {filteredProjects.length > 0 && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">פרויקט</label>
              <select
                value={form.project_id || ''}
                onChange={(e) => setForm({ ...form, project_id: e.target.value || null })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
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
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
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
              className="w-full text-sm bg-slate-50 rounded-lg px-3 py-2 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-slate-300"
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
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">מתוכנן ליום</label>
              <input
                type="date"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
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
              className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-slate-300"
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
