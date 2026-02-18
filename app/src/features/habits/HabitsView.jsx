import { useState, useMemo } from 'react';
import { Plus, X, Flame, Check, Sparkles } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useToast } from '../../hooks/useToast';
import * as localDb from '../../lib/localDb';
import { AREAS, AREA_LIST } from '../../lib/constants';

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getStreak(habitId) {
  const logs = localDb.getHabitLogs(habitId);
  const dates = new Set(logs.map((l) => l.date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().split('T')[0];
    if (dates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

const DAY_SHORT = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const COLORS = [
  { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400' },
  { id: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400' },
  { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  { id: 'amber', bg: 'bg-amber-500', light: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400' },
  { id: 'rose', bg: 'bg-rose-500', light: 'bg-rose-100 dark:bg-rose-900/30', text: 'text-rose-600 dark:text-rose-400' },
];

export default function HabitsView() {
  const [habits, setHabits] = useState(() => localDb.getHabits());
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArea, setNewArea] = useState(null);
  const [newColor, setNewColor] = useState('blue');
  const { addToast } = useToast();

  const today = getTodayStr();
  const last7 = useMemo(() => getLast7Days(), []);

  const refresh = () => setHabits(localDb.getHabits());

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    localDb.addHabit({ title: newTitle.trim(), area: newArea, color: newColor });
    setNewTitle('');
    setShowForm(false);
    refresh();
    addToast('הרגל נוסף');
  };

  const toggleHabit = (habitId, date) => {
    const logs = localDb.getHabitLogs(habitId);
    const existing = logs.find((l) => l.date === date);
    if (existing) {
      localDb.deleteHabitLog(existing.id);
    } else {
      localDb.addHabitLog(habitId, date);
    }
    refresh();
  };

  const deleteHabit = (id) => {
    localDb.deleteHabit(id);
    refresh();
    addToast('הרגל נמחק');
  };

  const completedToday = habits.filter((h) => {
    const logs = localDb.getHabitLogs(h.id);
    return logs.some((l) => l.date === today);
  }).length;

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">הרגלים</h1>
          <p className="text-xs text-slate-400 dark:text-gray-500 mt-0.5">
            {completedToday}/{habits.length} הושלמו היום
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="p-2 rounded-xl bg-slate-900 dark:bg-blue-600 text-white active:opacity-80 transition-colors touch-target"
          aria-label="הרגל חדש"
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Progress bar */}
      {habits.length > 0 && (
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-600 dark:text-gray-300">התקדמות יומית</span>
            <span className="text-xs text-slate-500 dark:text-gray-400">{Math.round((completedToday / habits.length) * 100)}%</span>
          </div>
          <div className="h-2 bg-slate-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${habits.length > 0 ? (completedToday / habits.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 p-4 mb-4 space-y-3 animate-slide-down">
          <input
            type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="שם ההרגל" dir="rtl" autoFocus
            className="w-full text-sm bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none dark:text-gray-100"
          />
          <div className="flex gap-2">
            {AREA_LIST.map((a) => (
              <button key={a.id} type="button" onClick={() => setNewArea(newArea === a.id ? null : a.id)}
                className={cn('flex-1 py-2 rounded-lg text-xs font-medium border transition-colors',
                  newArea === a.id ? `${a.lightBg} ${a.text} ${a.border}` : 'bg-white dark:bg-gray-900 border-slate-200 dark:border-gray-700 text-slate-500 dark:text-gray-400'
                )}>{a.label}</button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-xs text-slate-500 dark:text-gray-400">צבע:</span>
            {COLORS.map((c) => (
              <button key={c.id} type="button" onClick={() => setNewColor(c.id)}
                className={cn('w-6 h-6 rounded-full transition-transform', c.bg, newColor === c.id && 'ring-2 ring-offset-2 ring-slate-900 dark:ring-gray-100 dark:ring-offset-gray-800 scale-110')}
              />
            ))}
          </div>
          <button type="submit" disabled={!newTitle.trim()} className="w-full bg-slate-900 dark:bg-blue-600 text-white rounded-lg py-2.5 text-sm font-semibold disabled:opacity-40 active:opacity-80">
            צור הרגל
          </button>
        </form>
      )}

      {/* Habits list */}
      {habits.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-4">
            <Sparkles size={24} className="text-slate-400 dark:text-gray-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-600 dark:text-gray-300 mb-1">אין הרגלים</h3>
          <p className="text-xs text-slate-400 dark:text-gray-500 max-w-[240px]">צור הרגלים יומיים ועקוב אחרי ההתקדמות שלך</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => {
            const colorConfig = COLORS.find((c) => c.id === habit.color) || COLORS[0];
            const logs = localDb.getHabitLogs(habit.id);
            const logDates = new Set(logs.map((l) => l.date));
            const streak = getStreak(habit.id);
            const doneToday = logDates.has(today);
            const area = habit.area ? AREAS[habit.area] : null;

            return (
              <div key={habit.id} className={cn(
                'bg-white dark:bg-gray-800 rounded-xl border transition-colors',
                doneToday ? 'border-emerald-200 dark:border-emerald-800' : 'border-slate-200 dark:border-gray-700'
              )}>
                <div className="px-4 py-3">
                  <div className="flex items-center gap-3 mb-3">
                    {/* Today toggle */}
                    <button
                      onClick={() => toggleHabit(habit.id, today)}
                      className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 transition-all touch-target',
                        doneToday
                          ? `${colorConfig.bg} border-transparent`
                          : 'border-slate-300 dark:border-gray-600 active:scale-95'
                      )}
                    >
                      {doneToday && <Check size={16} className="text-white" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-sm font-medium', doneToday ? 'text-slate-400 dark:text-gray-500 line-through' : 'text-slate-800 dark:text-gray-200')}>
                        {habit.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {area && <span className={cn('text-[10px] px-1.5 py-0.5 rounded', area.lightBg, area.text)}>{area.label}</span>}
                        {streak > 0 && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                            <Flame size={10} />{streak} ימים
                          </span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => deleteHabit(habit.id)} className="p-1.5 text-slate-300 dark:text-gray-600 active:text-red-500">
                      <X size={14} />
                    </button>
                  </div>

                  {/* Last 7 days grid */}
                  <div className="flex gap-1.5 justify-center">
                    {last7.map((dateStr) => {
                      const done = logDates.has(dateStr);
                      const dayIdx = new Date(dateStr + 'T00:00').getDay();
                      const isToday = dateStr === today;
                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleHabit(habit.id, dateStr)}
                          className={cn(
                            'flex flex-col items-center gap-0.5',
                          )}
                        >
                          <span className="text-[9px] text-slate-400 dark:text-gray-500">{DAY_SHORT[dayIdx]}</span>
                          <div className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-[10px]',
                            done ? `${colorConfig.bg} text-white` : `${colorConfig.light}`,
                            isToday && !done && 'ring-1 ring-slate-300 dark:ring-gray-600',
                          )}>
                            {done ? <Check size={12} /> : new Date(dateStr + 'T00:00').getDate()}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
