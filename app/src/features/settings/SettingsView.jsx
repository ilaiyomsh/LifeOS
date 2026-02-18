import { useState } from 'react';
import { Settings, Sun, Moon, Monitor, Download, Upload, Trash2, Info } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTheme } from '../../lib/ThemeContext';
import { useToast } from '../../hooks/useToast';
import { GTD } from '../../lib/constants';
import * as localDb from '../../lib/localDb';

export default function SettingsView() {
  const { theme, setTheme } = useTheme();
  const { addToast } = useToast();

  const [settings, setSettings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('lifeos_settings') || '{}');
    } catch {
      return {};
    }
  });

  const maxDaily = settings.maxDailyMinutes || GTD.MAX_DAILY_MINUTES;
  const maxFocus = settings.maxFocusTasks || GTD.MAX_FOCUS_TASKS;

  const saveSetting = (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('lifeos_settings', JSON.stringify(updated));
  };

  const handleExport = () => {
    try {
      const data = {
        version: '3.0',
        exportedAt: new Date().toISOString(),
        tasks: JSON.parse(localStorage.getItem('lifeos_tasks') || '[]'),
        projects: JSON.parse(localStorage.getItem('lifeos_projects') || '[]'),
        events: JSON.parse(localStorage.getItem('lifeos_events') || '[]'),
        subtasks: JSON.parse(localStorage.getItem('lifeos_subtasks') || '[]'),
        habits: JSON.parse(localStorage.getItem('lifeos_habits') || '[]'),
        habit_logs: JSON.parse(localStorage.getItem('lifeos_habit_logs') || '[]'),
        focus_sessions: JSON.parse(localStorage.getItem('lifeos_focus_sessions') || '[]'),
        settings: JSON.parse(localStorage.getItem('lifeos_settings') || '{}'),
        reflections: JSON.parse(localStorage.getItem('lifeos_reflections') || '{}'),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifeos-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('גיבוי יוצא בהצלחה');
    } catch {
      addToast('שגיאה בייצוא');
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = JSON.parse(evt.target.result);
          if (!data.version) throw new Error('Invalid file');

          const tables = ['tasks', 'projects', 'events', 'subtasks', 'habits', 'habit_logs', 'focus_sessions'];
          for (const table of tables) {
            if (data[table]) {
              localStorage.setItem(`lifeos_${table}`, JSON.stringify(data[table]));
            }
          }
          if (data.settings) localStorage.setItem('lifeos_settings', JSON.stringify(data.settings));
          if (data.reflections) localStorage.setItem('lifeos_reflections', JSON.stringify(data.reflections));

          addToast('נתונים יובאו בהצלחה! רענן את הדף.', { duration: 6000 });
        } catch {
          addToast('שגיאה בייבוא — קובץ לא תקין');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    if (!window.confirm('האם למחוק את כל הנתונים? פעולה זו בלתי הפיכה.')) return;
    const keys = ['tasks', 'projects', 'events', 'subtasks', 'habits', 'habit_logs', 'focus_sessions', 'settings', 'reflections'];
    for (const key of keys) {
      localStorage.removeItem(`lifeos_${key}`);
    }
    addToast('כל הנתונים נמחקו. רענן את הדף.');
  };

  const themes = [
    { id: 'light', label: 'בהיר', icon: Sun },
    { id: 'system', label: 'אוטומטי', icon: Monitor },
    { id: 'dark', label: 'כהה', icon: Moon },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">הגדרות</h1>
      </div>

      <div className="space-y-4">
        {/* Theme */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-3">ערכת נושא</h2>
          <div className="flex gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    'flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl border text-sm font-medium transition-colors touch-target',
                    theme === t.id
                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700 active:bg-slate-50 dark:active:bg-gray-800'
                  )}
                >
                  <Icon size={18} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Work settings */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-4">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">עבודה</h2>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">קיבולת יומית (דקות)</label>
            <input
              type="range" min="60" max="600" step="30" value={maxDaily}
              onChange={(e) => saveSetting('maxDailyMinutes', parseInt(e.target.value))}
              className="w-full accent-slate-900 dark:accent-blue-500"
            />
            <div className="flex justify-between text-[11px] text-slate-400 dark:text-gray-500 mt-0.5">
              <span>1 שעה</span>
              <span className="font-semibold text-slate-600 dark:text-gray-300">{Math.round(maxDaily / 60 * 10) / 10} שעות</span>
              <span>10 שעות</span>
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-500 dark:text-gray-400 mb-1 block">מקסימום משימות מיקוד</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => saveSetting('maxFocusTasks', n)}
                  className={cn(
                    'flex-1 py-2 rounded-lg text-sm font-medium border transition-colors',
                    maxFocus === n
                      ? 'bg-slate-900 dark:bg-blue-600 text-white border-slate-900 dark:border-blue-600'
                      : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-gray-700'
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Data management */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">נתונים</h2>
          <button
            onClick={handleExport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 active:bg-slate-50 dark:active:bg-gray-700 transition-colors touch-target"
          >
            <Download size={18} className="text-blue-500 shrink-0" />
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">ייצוא נתונים</p>
              <p className="text-[11px] text-slate-400 dark:text-gray-500">הורד קובץ JSON עם כל הנתונים</p>
            </div>
          </button>
          <button
            onClick={handleImport}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-gray-700 active:bg-slate-50 dark:active:bg-gray-700 transition-colors touch-target"
          >
            <Upload size={18} className="text-emerald-500 shrink-0" />
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">ייבוא נתונים</p>
              <p className="text-[11px] text-slate-400 dark:text-gray-500">שחזר מקובץ גיבוי</p>
            </div>
          </button>
          <button
            onClick={handleClearData}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800 active:bg-red-50 dark:active:bg-red-900/20 transition-colors touch-target"
          >
            <Trash2 size={18} className="text-red-500 shrink-0" />
            <div className="text-right">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">מחק הכל</p>
              <p className="text-[11px] text-red-400 dark:text-red-500">מחיקת כל הנתונים מהמכשיר</p>
            </div>
          </button>
        </section>

        {/* App info */}
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-blue-600 flex items-center justify-center">
              <Info size={18} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">LifeOS</p>
              <p className="text-[11px] text-slate-400 dark:text-gray-500">גרסה 3.0 — GTD Task Management</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
