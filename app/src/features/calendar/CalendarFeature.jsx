import React, { useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS, EVENT_TYPES, API_KEY } from '../../lib/constants';
import { analyzeTaskWithAI } from '../../lib/ai';
import { ChevronLeft, ChevronRight, Plus, X, Calendar as CalendarIcon, Clock, Sparkles, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EditTaskDialog } from '../../components/ui/EditTaskDialog';

export const CalendarFeature = () => {
    const { tasks, addTask } = useTasks();
    const [currentDate, setCurrentDate] = useState(new Date());

    // Day View Modal State
    const [selectedDate, setSelectedDate] = useState(null);
    const [newTaskText, setNewTaskText] = useState('');
    const [isEventToggle, setIsEventToggle] = useState(false); // New toggle for modal add
    const [eventStartTime, setEventStartTime] = useState('09:00');
    const [eventEndTime, setEventEndTime] = useState('10:00');
    const [eventType, setEventType] = useState('other');
    const [taskDomain, setTaskDomain] = useState('work');
    const [taskImportance, setTaskImportance] = useState(3);
    const [taskUrgency, setTaskUrgency] = useState(3);
    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiReasoning, setAiReasoning] = useState('');

    // Task Edit Modal State
    const [editingTask, setEditingTask] = useState(null);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const next = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + 1);
        setCurrentDate(newDate);
    };

    const prev = () => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() - 1);
        setCurrentDate(newDate);
    };

    const today = new Date();
    const daysInMonth = [];
    const startDay = startOfMonth.getDay(); // 0 is Sunday

    for (let i = 0; i < startDay; i++) daysInMonth.push(null);
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
        daysInMonth.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
    }

    const handleAiSuggest = async () => {
        if (!newTaskText.trim()) {
            setAiReasoning('אנא הזן טקסט משימה תחילה.');
            return;
        }

        if (!API_KEY) {
            setAiReasoning('מפתח API של GEMINI חסר.');
            return;
        }

        setAiAnalyzing(true);
        setAiReasoning('');
        try {
            const result = await analyzeTaskWithAI(newTaskText, DOMAINS[taskDomain].label, API_KEY);
            setTaskImportance(result.importance || taskImportance);
            setTaskUrgency(result.urgency || taskUrgency);
            setAiReasoning(result.reasoning);
        } catch (error) {
            console.error(error);
            setAiReasoning(error.message || 'ניתוח AI נכשל.');
        } finally {
            setAiAnalyzing(false);
        }
    };

    const handleAddTaskToDate = (e) => {
        e.preventDefault();
        if (!newTaskText.trim() || !selectedDate) return;

        const payload = {
            text: newTaskText,
            domain: isEventToggle ? 'work' : taskDomain,
            importance: isEventToggle ? 3 : taskImportance,
            urgency: isEventToggle ? 3 : taskUrgency,
            deadline: selectedDate.toISOString().split('T')[0],
            type: isEventToggle ? 'event' : 'task',
            eventType: isEventToggle ? eventType : undefined,
            startTime: isEventToggle ? eventStartTime : undefined,
            endTime: isEventToggle ? eventEndTime : undefined,
            time: isEventToggle ? eventStartTime : undefined // Keep for backward compatibility
        };

        addTask(payload);
        setNewTaskText('');
        setTaskDomain('work');
        setTaskImportance(3);
        setTaskUrgency(3);
        setAiReasoning('');
    };

    const renderDayCell = (dateObj) => {
        if (!dateObj) return <div className="bg-slate-50/30 min-h-[80px]"></div>;

        const dateStr = dateObj.toISOString().split('T')[0];
        const isToday = dateObj.getDate() === today.getDate() && dateObj.getMonth() === today.getMonth();
        const dayItems = tasks.filter(t => t.deadline === dateStr && !t.completedAt);

        // Sort: Events first (by time), then Tasks
        dayItems.sort((a, b) => {
            if (a.type === 'event' && b.type !== 'event') return -1;
            if (a.type !== 'event' && b.type === 'event') return 1;
            if (a.type === 'event') return (a.time || '').localeCompare(b.time || '');
            return 0;
        });

        return (
            <div
                onClick={() => setSelectedDate(dateObj)}
                className={cn(
                    "min-h-[80px] p-1 border-t border-l border-slate-100 relative transition-all hover:bg-white cursor-pointer group flex flex-col gap-0.5",
                    isToday ? 'bg-blue-50/30' : 'bg-slate-50/10'
                )}
            >
                <div className="flex justify-between items-start mb-0.5">
                    <span className={cn(
                        "text-[10px] font-bold block w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                        isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'text-slate-400 group-hover:bg-slate-200/50'
                    )}>
                        {dateObj.getDate()}
                    </span>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Plus size={12} className="text-slate-400" />
                    </div>
                </div>

                <div className="space-y-0.5 overflow-hidden">
                    {dayItems.slice(0, 4).map(t => {  // Limit to 4 items preview
                        if (t.type === 'event') {
                            return (
                                <div key={t.id} className="text-[9px] px-1 py-0.5 rounded bg-blue-100 text-blue-700 font-medium truncate flex items-center gap-1 border-l-2 border-blue-500">
                                    <span className="opacity-75 text-[8px] font-mono leading-none">
                                        {t.startTime && t.endTime ? `${t.startTime}-${t.endTime}` : t.time || ''}
                                    </span>
                                    {t.text}
                                </div>
                            )
                        }
                        return (
                            <div key={t.id} className={`text-[9px] px-1 py-0.5 rounded truncate border-l-2 ${DOMAINS[t.domain].bgLight} ${DOMAINS[t.domain].text} border-${DOMAINS[t.domain].color.split('-')[1]}-500 shadow-sm opacity-80 hover:opacity-100`}>
                                {t.text}
                            </div>
                        );
                    })}
                    {dayItems.length > 4 && (
                        <div className="text-[8px] text-slate-400 text-center font-bold tracking-tight">
                            + {dayItems.length - 4} נוספות
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col space-y-4">
            <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm sticky top-0 z-10 shrink-0">
                <div className="font-bold text-slate-800 flex items-center justify-between w-full">
                    <button 
                        onClick={prev} 
                        aria-label="חודש קודם"
                        className="p-2 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <ChevronRight size={18} />
                    </button>
                    <span className="text-base tracking-tight font-black uppercase">
                        {currentDate.toLocaleDateString('he-IL', { month: 'long', year: 'numeric' })}
                    </span>
                    <button 
                        onClick={next} 
                        aria-label="חודש הבא"
                        className="p-2 hover:bg-slate-100 rounded-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        <ChevronLeft size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto rounded-xl shadow-inner border border-slate-200 bg-slate-50 relative">
                <div className="grid grid-cols-7 bg-white sticky top-0 z-10 shadow-sm">
                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                        <div key={d} className="py-3 text-center text-xs font-black text-slate-400 bg-slate-50/80 backdrop-blur border-b border-l border-slate-100 last:border-l-0">
                            {d}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 bg-white min-h-[400px]">
                    {daysInMonth.map((date, i) => (
                        <div key={i} className="border-b border-l border-slate-100 last:border-l-0 hover:z-10 relative">
                            {renderDayCell(date)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Day Detail Modal */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0 bg-slate-900/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedDate(null)}>
                    <div
                        className="bg-white w-full sm:w-96 rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-10 duration-200 border border-slate-200"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="bg-white p-2 rounded-lg shadow-sm font-bold text-xl font-mono text-slate-800">
                                    {selectedDate.getDate()}
                                </div>
                                <div className="text-sm font-bold text-slate-500 uppercase">
                                    {selectedDate.toLocaleDateString('he-IL', { weekday: 'long', month: 'long' })}
                                </div>
                            </div>
                            <button 
                                onClick={() => setSelectedDate(null)} 
                                aria-label="סגור"
                                className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 max-h-[50vh] overflow-y-auto space-y-2">
                            {tasks.filter(t => t.deadline === selectedDate.toISOString().split('T')[0] && !t.completedAt).length === 0 && (
                                <div className="text-center py-6 text-slate-400">
                                    <CalendarIcon className="mx-auto mb-2 opacity-50" size={32} />
                                    <p className="text-xs">אין משימות/אירועים ליום זה</p>
                                </div>
                            )}
                            {tasks.filter(t => t.deadline === selectedDate.toISOString().split('T')[0] && !t.completedAt).sort((a, b) => {
                                // Same sort: Events first by time
                                if (a.type === 'event' && b.type !== 'event') return -1;
                                if (a.type !== 'event' && b.type === 'event') return 1;
                                if (a.type === 'event') return (a.time || '').localeCompare(b.time || '');
                                return 0;
                            }).map(t => {
                                const isEvent = t.type === 'event';

                                return (
                                    <div key={t.id} onClick={() => setEditingTask(t)} className={cn(
                                        "p-3 rounded-xl shadow-sm border transition-colors cursor-pointer group flex justify-between items-center",
                                        isEvent ? "bg-blue-50 border-blue-100 hover:border-blue-300" : "bg-white border-slate-100 hover:border-slate-300"
                                    )}>
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            {isEvent ? (
                                                <div className="bg-blue-100 text-blue-600 p-1.5 rounded-lg shrink-0">
                                                    <Clock size={14} />
                                                </div>
                                            ) : (
                                                <div className={`w-3 h-3 rounded-full ${DOMAINS[t.domain].color} shrink-0`}></div>
                                            )}

                                            <div className="min-w-0">
                                                <div className="text-sm font-bold text-slate-700 truncate">{t.text}</div>
                                                {isEvent && (
                                                    <div className="text-[10px] text-slate-400 font-mono">
                                                        {t.startTime && t.endTime 
                                                            ? `${t.startTime} - ${t.endTime}` 
                                                            : t.time || 'כל היום'
                                                        } • {EVENT_TYPES[t.eventType]?.label || 'אירוע'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">ערוך</span>
                                    </div>
                                );
                            })}
                        </div>

                        <form onSubmit={handleAddTaskToDate} className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                            {isEventToggle ? (
                                <div className="grid grid-cols-3 gap-2">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 block">סוג אירוע</label>
                                        <select
                                            value={eventType}
                                            onChange={e => setEventType(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white"
                                        >
                                            {Object.entries(EVENT_TYPES).map(([key, eventType]) => (
                                                <option key={key} value={key}>{eventType.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 block">התחלה</label>
                                        <input
                                            type="time"
                                            value={eventStartTime}
                                            onChange={e => setEventStartTime(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white font-mono"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-slate-500 block">סיום</label>
                                        <input
                                            type="time"
                                            value={eventEndTime}
                                            onChange={e => setEventEndTime(e.target.value)}
                                            className="w-full text-xs px-2 py-1.5 rounded-lg border border-slate-200 focus:border-blue-400 outline-none bg-white font-mono"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Domain Selection */}
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">קטגוריה</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {Object.entries(DOMAINS).map(([key, d]) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    onClick={() => {
                                                        setTaskDomain(key);
                                                        setAiReasoning('');
                                                    }}
                                                    className={cn(
                                                        "h-9 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                                        taskDomain === key
                                                            ? `bg-white ${d.text} ${d.border} ring-2 ring-offset-1 ${d.ring}`
                                                            : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                                    )}
                                                >
                                                    {d.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Importance and Urgency Sliders */}
                                    <div className="p-3 bg-white rounded-xl border border-slate-100 space-y-3">
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs font-bold text-slate-500 w-16 shrink-0">חשיבות</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="0.5"
                                                value={taskImportance}
                                                onChange={e => setTaskImportance(parseFloat(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-blue-600"
                                            />
                                            <span className="text-sm font-black text-blue-600 w-6 text-center">{taskImportance}</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-4">
                                            <span className="text-xs font-bold text-slate-500 w-16 shrink-0">דחיפות</span>
                                            <input
                                                type="range"
                                                min="1"
                                                max="5"
                                                step="0.5"
                                                value={taskUrgency}
                                                onChange={e => setTaskUrgency(parseFloat(e.target.value))}
                                                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-rose-500"
                                            />
                                            <span className="text-sm font-black text-rose-500 w-6 text-center">{taskUrgency}</span>
                                        </div>
                                    </div>
                                </>
                            )}
                            
                            {/* Task Input with AI */}
                            <div className="relative">
                                <input
                                    value={newTaskText}
                                    onChange={e => {
                                        setNewTaskText(e.target.value);
                                        if (aiReasoning) setAiReasoning('');
                                    }}
                                    placeholder={isEventToggle ? "הוסף אירוע..." : "הוסף משימה..."}
                                    aria-label={isEventToggle ? "טקסט אירוע" : "טקסט משימה"}
                                    className="w-full text-sm px-3 py-2 pr-12 rounded-xl border border-slate-200 focus:border-blue-400 outline-none transition-all focus:ring-2 focus:ring-blue-100"
                                    autoFocus
                                />
                                {!isEventToggle && (
                                    <button
                                        type="button"
                                        onClick={handleAiSuggest}
                                        disabled={aiAnalyzing}
                                        aria-label="הצע ניתוח AI"
                                        className="absolute left-2 top-1/2 -translate-y-1/2 text-violet-500 hover:bg-violet-50 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                                    >
                                        {aiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                                    </button>
                                )}
                            </div>

                            {!isEventToggle && aiReasoning && (
                                <div className="text-xs text-violet-600 bg-violet-50 p-2.5 rounded-xl border border-violet-100 animate-fadeIn leading-relaxed">
                                    🤖 {aiReasoning}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEventToggle(!isEventToggle)}
                                    aria-label={isEventToggle ? "החלף למשימה" : "החלף לאירוע"}
                                    className={cn(
                                        "p-2 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 shrink-0",
                                        isEventToggle ? "bg-blue-100 border-blue-300 text-blue-600" : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                                    )}
                                    title={isEventToggle ? "החלף למשימה" : "החלף לאירוע"}
                                >
                                    {isEventToggle ? <Clock size={20} /> : <div className="w-5 h-5 rounded-full bg-slate-300 flex items-center justify-center"><div className="w-2 h-2 bg-white rounded-full"></div></div>}
                                </button>
                                <button 
                                    type="submit" 
                                    aria-label={isEventToggle ? "הוסף אירוע" : "הוסף משימה"}
                                    className="flex-1 bg-slate-900 text-white py-2 rounded-xl hover:bg-black transition-colors shadow-lg active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                >
                                    {isEventToggle ? "הוסף אירוע" : "הוסף משימה"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {editingTask && (
                <EditTaskDialog
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
};
