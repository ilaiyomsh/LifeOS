import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Play, Pause, CheckCircle, Layout, History,
  BarChart2, Calendar as CalIcon, ChevronLeft, ChevronRight,
  Clock, Trash2, X, Target, List
} from 'lucide-react';

// --- הגדרות ---

const DOMAINS = {
  work: { label: 'עבודה', color: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', bgLight: 'bg-blue-50' },
  study: { label: 'לימודים', color: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', bgLight: 'bg-yellow-50' },
  family: { label: 'משפחה', color: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', bgLight: 'bg-red-50' },
  household: { label: 'משק בית', color: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', bgLight: 'bg-green-50' },
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// --- רכיבי משנה ---

// 1. טאב תכנון: מפת החום + תאריך יעד
const HeatmapPlanningView = ({ tasks, addTask, deleteTask }) => {
  const [text, setText] = useState('');
  const [domain, setDomain] = useState('work');
  const [importance, setImportance] = useState(3);
  const [urgency, setUrgency] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [hoveredTask, setHoveredTask] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    addTask({
      text,
      domain,
      importance: Number(importance),
      urgency: Number(urgency),
      deadline
    });
    setText('');
    setImportance(3);
    setUrgency(3);
    setDeadline('');
  };

  const getPosition = (val) => val * 20 - 10;

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm shrink-0">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex gap-2">
            <input
              value={text} onChange={e => setText(e.target.value)}
              placeholder="משימה חדשה..."
              className="flex-grow p-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <input
              type="date"
              value={deadline}
              onChange={e => setDeadline(e.target.value)}
              className="p-2 border rounded-lg text-sm w-36"
            />
          </div>

          <div className="flex justify-between items-center">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-[70%]">
              {Object.entries(DOMAINS).map(([key, d]) => (
                <button key={key} type="button" onClick={() => setDomain(key)}
                  className={`px-2 py-1 rounded text-xs whitespace-nowrap border transition-colors ${domain === key ? `${d.bgLight} ${d.text} ${d.border} font-bold` : 'bg-slate-50 border-transparent text-slate-500'}`}>
                  {d.label}
                </button>
              ))}
            </div>
            <button type="submit" className="bg-slate-900 text-white px-4 py-1.5 rounded-lg font-bold text-xs shrink-0">הוסף למפה</button>
          </div>

          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-2 rounded-lg">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold"><span>חשיבות (Y)</span><span className="text-blue-600">{importance}</span></div>
              <input type="range" min="1" max="5" value={importance} onChange={e => setImportance(e.target.value)} className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-blue-600" />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-slate-500 font-bold"><span>דחיפות (X)</span><span className="text-pink-600">{urgency}</span></div>
              <input type="range" min="1" max="5" value={urgency} onChange={e => setUrgency(e.target.value)} className="w-full h-1 bg-slate-200 rounded appearance-none cursor-pointer accent-pink-600" />
            </div>
          </div>
        </form>
      </div>

      <div className="flex-grow relative bg-slate-800 rounded-xl border border-slate-700 shadow-inner overflow-hidden min-h-[300px]">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-red-500 via-transparent to-transparent"></div>
        <div className="absolute inset-4 sm:inset-8 grid grid-cols-5 grid-rows-5 border-t border-r border-slate-600/30">
          {[...Array(5)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="border-l border-slate-600/30 h-full w-full relative"><span className="absolute -bottom-5 -left-1 text-[10px] text-slate-500">{i + 1}</span></div>
              <div className="border-b border-slate-600/30 h-full w-full absolute left-0" style={{ top: `${i * 20}%` }}><span className="absolute -left-4 -top-2 text-[10px] text-slate-500">{5 - i}</span></div>
            </React.Fragment>
          ))}
        </div>

        <div className="absolute bottom-1 right-2 text-[10px] font-bold text-pink-400">דחיפות ➔</div>
        <div className="absolute top-2 left-1 text-[10px] font-bold text-blue-400 writing-vertical-lr -rotate-90 origin-top-left">חשיבות ➔</div>

        <div className="absolute inset-4 sm:inset-8 z-10">
          {tasks.filter(t => !t.completedAt).map((task) => {
            const bottomPct = getPosition(task.importance);
            const leftPct = getPosition(task.urgency);
            const isHovered = hoveredTask === task.id;

            return (
              <div
                key={task.id}
                className={`absolute transform -translate-x-1/2 translate-y-1/2 transition-all duration-300 cursor-pointer ${isHovered ? 'z-50 scale-125' : 'z-20 hover:scale-110'}`}
                style={{ bottom: `${bottomPct}%`, left: `${leftPct}%` }}
                onMouseEnter={() => setHoveredTask(task.id)}
                onMouseLeave={() => setHoveredTask(null)}
                onClick={() => setHoveredTask(task.id === hoveredTask ? null : task.id)}
              >
                <div className={`w-3 h-3 sm:w-4 sm:h-4 rounded-full shadow-lg border border-slate-900 ${DOMAINS[task.domain].color} ${isHovered ? 'ring-2 ring-white box-content' : ''}`}></div>
                {isHovered && (
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-48 bg-slate-900/95 backdrop-blur border border-slate-600 text-white p-3 rounded-lg text-xs text-center shadow-2xl z-50 pointer-events-none">
                    <div className="font-bold mb-1">{task.text}</div>
                    {task.deadline && <div className="text-slate-300 mb-2">📅 {new Date(task.deadline).toLocaleDateString('he-IL')}</div>}
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-700 pt-1">
                      <span>⭐ {task.importance}</span>
                      <span>🔥 {task.urgency}</span>
                    </div>
                  </div>
                )}
                {isHovered && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteTask(task.id); }}
                    className="absolute -top-4 -right-4 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 pointer-events-auto shadow-sm"
                  >
                    <X size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// 2. טאב חדש: לוח שנה
const CalendarView = ({ tasks }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // ניווט
  const next = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() + 1);
    else newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const prev = () => {
    const newDate = new Date(currentDate);
    if (viewMode === 'month') newDate.setMonth(newDate.getMonth() - 1);
    else newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const today = new Date();

  // יצירת ימי החודש
  const daysInMonth = [];
  const startDay = startOfMonth.getDay(); // 0 is Sunday

  // ריפוד התחלה
  for (let i = 0; i < startDay; i++) {
    daysInMonth.push(null);
  }
  // ימים אמיתיים
  for (let i = 1; i <= endOfMonth.getDate(); i++) {
    daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
  }

  // רינדור התא (יום בודד)
  const renderDayCell = (dateObj, isCompact = false) => {
    if (!dateObj) return <div className="bg-slate-50/50"></div>;

    const dateStr = dateObj.toISOString().split('T')[0];
    const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth();

    const dayTasks = tasks.filter(t => t.deadline === dateStr && !t.completedAt);

    return (
      <div className={`min-h-[80px] p-1 border-t border-l border-slate-100 relative ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}>
        <span className={`text-[10px] font-bold block mb-1 ${isToday ? 'text-blue-600' : 'text-slate-400'}`}>
          {dateObj.getDate()}
        </span>
        <div className="space-y-1">
          {dayTasks.map(t => (
            <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded truncate border-l-2 ${DOMAINS[t.domain].bgLight} ${DOMAINS[t.domain].text} border-${DOMAINS[t.domain].color.split('-')[1]}-500`}>
              {t.text}
            </div>
          ))}
          {dayTasks.length === 0 && <div className="h-4"></div>}
        </div>
      </div>
    );
  };

  // תצוגת חודש
  const renderMonthGrid = () => (
    <div className="grid grid-cols-7 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
      {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
        <div key={d} className="p-2 text-center text-xs font-bold text-slate-500 bg-slate-50 border-b border-l border-slate-100 last:border-l-0">
          {d}
        </div>
      ))}
      {daysInMonth.map((date, i) => (
        <div key={i} className="border-b border-l border-slate-100 last:border-l-0">
          {renderDayCell(date)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* כותרת וניווט */}
      <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('month')} className={`px-3 py-1 text-xs rounded-lg transition-colors ${viewMode === 'month' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>חודש</button>
          {/* אפשר להוסיף תצוגת שבוע בעתיד, כרגע חודש זה העיקר */}
        </div>
        <div className="font-bold text-slate-800 flex items-center gap-2">
          <button onClick={prev} className="p-1 hover:bg-slate-100 rounded"><ChevronRight size={16} /></button>
          <span>
            {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
          </span>
          <button onClick={next} className="p-1 hover:bg-slate-100 rounded"><ChevronLeft size={16} /></button>
        </div>
      </div>

      {/* גוף הלוח */}
      <div className="flex-grow overflow-y-auto">
        {renderMonthGrid()}
      </div>

      <div className="flex gap-4 text-[10px] text-slate-400 justify-center">
        {Object.entries(DOMAINS).map(([k, d]) => (
          <div key={k} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${d.color}`}></div> {d.label}
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. טאב ביצוע (רשימה וטיימר) - מעודכן עם תאריכים
const ExecutionView = ({ tasks, activeTaskId, toggleTimer, completeTask }) => {
  const sortedTasks = useMemo(() => {
    return tasks
      .filter(t => !t.completedAt)
      .sort((a, b) => {
        const scoreA = (a.importance * 1.5) + a.urgency;
        const scoreB = (b.importance * 1.5) + b.urgency;
        return scoreB - scoreA;
      });
  }, [tasks]);

  const activeTask = tasks.find(t => t.id === activeTaskId);

  return (
    <div className="flex flex-col h-full space-y-4">

      <div className={`rounded-2xl p-6 transition-all shadow-lg border-2 ${activeTask ? 'bg-slate-900 text-white border-blue-500 scale-100' : 'bg-slate-100 border-dashed border-slate-300 text-slate-400 scale-[0.98]'}`}>
        {activeTask ? (
          <div className="relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-blue-300">{DOMAINS[activeTask.domain].label}</span>
              <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold uppercase tracking-widest animate-pulse">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> הקלטה פעילה
              </span>
            </div>
            <h2 className="text-xl font-bold mb-4 line-clamp-2">{activeTask.text}</h2>
            <div className="flex items-end justify-between">
              <div className="font-mono text-5xl font-bold tracking-tighter tabular-nums">
                {formatTime(activeTask.elapsedTime || 0)}
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleTimer(activeTask.id)} className="bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full shadow-lg active:scale-95 transition-transform"><Pause fill="currentColor" size={20} /></button>
                <button onClick={() => completeTask(activeTask.id)} className="bg-green-500 hover:bg-green-400 text-black p-3 rounded-full shadow-lg active:scale-95 transition-transform"><CheckCircle size={20} /></button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <Target className="mx-auto mb-2 opacity-50" size={32} />
            <p className="font-bold text-sm">המערכת בהמתנה</p>
          </div>
        )}
      </div>

      <div className="flex-grow overflow-y-auto space-y-3 pr-1">
        {sortedTasks.map((task, idx) => {
          if (task.id === activeTaskId) return null;
          return (
            <div key={task.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-colors">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{idx + 1}</div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${DOMAINS[task.domain].color}`}></span>
                    <span>{DOMAINS[task.domain].label}</span>
                    {task.deadline && (
                      <span className={`${new Date(task.deadline) < new Date() ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                        • {new Date(task.deadline).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="font-bold text-slate-800 text-sm truncate">{task.text}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleTimer(task.id)} className="p-2 rounded-full bg-slate-50 text-slate-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><Play size={16} fill="currentColor" /></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// 4. טאב היסטוריה (ללא שינוי)
const HistoryView = ({ tasks }) => {
  const completedTasks = tasks.filter(t => t.completedAt).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  const totalTime = completedTasks.reduce((acc, t) => acc + (t.elapsedTime || 0), 0);

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-slate-800">{completedTasks.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">הושלמו</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <div className="text-3xl font-bold text-blue-600">{Math.floor(totalTime / 60)}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">דקות</div>
        </div>
      </div>
      <div className="flex-grow bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-600 text-xs flex items-center gap-2"><History size={14} /> יומן</div>
        <div className="overflow-y-auto divide-y divide-slate-100 flex-grow">
          {completedTasks.map((task) => (
            <div key={task.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
              <div className="min-w-0 pr-2">
                <div className="font-bold text-slate-800 text-sm truncate">{task.text}</div>
                <div className="flex gap-2 text-[10px] mt-0.5">
                  <span className="text-slate-400">{new Date(task.completedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
              <div className="text-left shrink-0 pl-2 border-l border-slate-100">
                <div className="text-sm font-mono font-bold text-slate-700">{task.elapsedTime > 0 ? formatTime(task.elapsedTime) : '--:--'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- אפליקציה ראשית ---

export default function LifeOS_Calendar() {
  const [activeTab, setActiveTab] = useState('plan'); // plan, calendar, execute, control
  const [tasks, setTasks] = useState([
    { id: 1, text: 'הגשת סמינריון', domain: 'study', importance: 5, urgency: 3, elapsedTime: 1200, completedAt: null, deadline: '2025-12-20' },
    { id: 2, text: 'קניות לבית', domain: 'household', importance: 3, urgency: 4, elapsedTime: 0, completedAt: null, deadline: '2025-12-14' },
    { id: 3, text: 'דייט שבועי', domain: 'family', importance: 5, urgency: 2, elapsedTime: 0, completedAt: null, deadline: '2025-12-18' },
  ]);
  const [activeTaskId, setActiveTaskId] = useState(null);

  useEffect(() => {
    let interval = null;
    if (activeTaskId) {
      interval = setInterval(() => {
        setTasks(prevTasks => prevTasks.map(t => t.id === activeTaskId ? { ...t, elapsedTime: (t.elapsedTime || 0) + 1 } : t));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTaskId]);

  const addTask = (task) => setTasks([...tasks, { ...task, id: Date.now(), elapsedTime: 0, completedAt: null }]);
  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };
  const toggleTimer = (id) => activeTaskId === id ? setActiveTaskId(null) : setActiveTaskId(id);
  const completeTask = (id) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      setActiveTaskId(null);
      setTasks(tasks.map(t => t.id === id ? { ...t, completedAt: new Date().toISOString() } : t));
    }
  };

  const NavBtn = ({ tab, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex flex-col items-center justify-center w-14 h-full transition-all ${activeTab === tab ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      <div className={`p-1 rounded-lg ${activeTab === tab ? 'bg-blue-50' : ''}`}>
        <Icon size={22} strokeWidth={activeTab === tab ? 2.5 : 2} />
      </div>
      <span className="text-[9px] font-bold mt-0.5">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col h-screen overflow-hidden" dir="rtl">
      <header className="bg-slate-900 text-white p-3 px-4 shadow-lg shrink-0 flex justify-between items-center z-10">
        <h1 className="text-lg font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">LifeOS Calendar</h1>
        <div className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded border border-slate-700 text-slate-300">
          {activeTaskId ? '● טיימר פעיל' : '○ המתנה'}
        </div>
      </header>

      <main className="flex-grow p-4 overflow-hidden relative w-full max-w-2xl mx-auto">
        {activeTab === 'plan' && <HeatmapPlanningView tasks={tasks} addTask={addTask} deleteTask={deleteTask} />}
        {activeTab === 'calendar' && <CalendarView tasks={tasks} />}
        {activeTab === 'execute' && <ExecutionView tasks={tasks} activeTaskId={activeTaskId} toggleTimer={toggleTimer} completeTask={completeTask} />}
        {activeTab === 'control' && <HistoryView tasks={tasks} />}
      </main>

      <nav className="bg-white border-t border-slate-200 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)] shrink-0 z-20">
        <div className="flex justify-between items-center h-16 max-w-md mx-auto px-4">
          <NavBtn tab="plan" icon={BarChart2} label="תכנון" />
          <NavBtn tab="calendar" icon={CalIcon} label="לוח שנה" />

          <button onClick={() => setActiveTab('execute')} className="relative -top-5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all ${activeTab === 'execute' ? 'bg-slate-900 ring-4 ring-blue-100 scale-110' : 'bg-slate-800 hover:bg-slate-700'}`}>
              <Play size={24} className="text-white ml-1" fill={activeTaskId ? "currentColor" : "none"} />
            </div>
            <span className={`absolute -bottom-4 w-full text-center text-[10px] font-bold ${activeTab === 'execute' ? 'text-slate-900' : 'text-slate-400'}`}>ביצוע</span>
          </button>

          <NavBtn tab="control" icon={History} label="יומן" />
          <div className="w-14"></div> {/* מרווח לאיזון */}
        </div>
      </nav>
    </div>
  );
}