import React, { useState, useRef } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS, EVENT_TYPES, API_KEY } from '../../lib/constants';
import { analyzeTaskWithAI } from '../../lib/ai';
import { X, Calendar as CalendarIcon, Star, Flame, CheckSquare, Clock, ChevronRight, ChevronLeft, Sparkles, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EditTaskDialog } from '../../components/ui/EditTaskDialog';

const QuadrantBackground = () => (
        <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
        <div className="bg-gradient-to-br from-green-50/80 to-green-100/50 border-r border-b border-slate-200/50 flex items-start justify-start p-4 text-green-900/10 hover:text-green-900/20 transition-colors">
            <span className="font-black text-5xl uppercase tracking-tighter mix-blend-multiply">עשה</span>
        </div>
        <div className="bg-gradient-to-bl from-blue-50/80 to-blue-100/50 border-b border-slate-200/50 flex items-start justify-end p-4 text-blue-900/10 hover:text-blue-900/20 transition-colors">
            <span className="font-black text-5xl uppercase tracking-tighter mix-blend-multiply">תכנן</span>
        </div>
        <div className="bg-gradient-to-tr from-amber-50/80 to-amber-100/50 border-r border-slate-200/50 flex items-end justify-start p-4 text-amber-900/10 hover:text-amber-900/20 transition-colors">
            <span className="font-black text-5xl uppercase tracking-tighter mix-blend-multiply">העבר</span>
        </div>
        <div className="bg-gradient-to-tl from-red-50/80 to-red-100/50 flex items-end justify-end p-4 text-red-900/10 hover:text-red-900/20 transition-colors">
            <span className="font-black text-5xl uppercase tracking-tighter mix-blend-multiply">מחק</span>
        </div>
    </div>
);

export const PlanningFeature = () => {
    const { tasks, addTask, deleteTask } = useTasks();
    const [hoveredTask, setHoveredTask] = useState(null);

    // Quick Add State
    const [isAdding, setIsAdding] = useState(false);
    const [tempTask, setTempTask] = useState({
        text: '',
        domain: 'work',
        importance: 3,
        urgency: 3,
        deadline: new Date().toISOString().split('T')[0],
        type: 'task',
        time: '',
        eventType: 'other',
        duration: 60
    });

    const [aiAnalyzing, setAiAnalyzing] = useState(false);
    const [aiReasoning, setAiReasoning] = useState('');

    // Edit State
    const [editingTask, setEditingTask] = useState(null);

    // Schedule Panel State
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);

    const heatmapRef = useRef(null);

    const handleMapClick = (e) => {
        if (e.target.closest('.no-map-click')) return;

        const rect = heatmapRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) * (100 / rect.width));
        const y = ((rect.bottom - e.clientY) * (100 / rect.height));

        const urgencyVal = Math.max(1, Math.min(5, (x * 0.01) * 5));
        const importanceVal = Math.max(1, Math.min(5, (y * 0.01) * 5));

        setTempTask(prev => ({
            ...prev,
            urgency: parseFloat(urgencyVal.toFixed(1)),
            importance: parseFloat(importanceVal.toFixed(1)),
            type: 'task',
            text: '', // Reset text on new click
            aiReasoning: ''
        }));
        setAiReasoning('');
        setIsAdding(true);
    };

    const handleAiSuggest = async () => {
        if (!tempTask.text.trim()) {
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
            const result = await analyzeTaskWithAI(tempTask.text, DOMAINS[tempTask.domain].label, API_KEY);
            setTempTask(prev => ({
                ...prev,
                importance: result.importance || prev.importance,
                urgency: result.urgency || prev.urgency,
                duration: result.duration || prev.duration
            }));
            setAiReasoning(result.reasoning);
        } catch (error) {
            console.error(error);
            setAiReasoning(error.message || 'ניתוח AI נכשל.');
        } finally {
            setAiAnalyzing(false);
        }
    };

    const handleSave = (e) => {
        e.preventDefault();
        if (!tempTask.text.trim()) return;

        const payload = { ...tempTask };
        addTask(payload);
        setIsAdding(false);
        setTempTask(prev => ({ ...prev, text: '', aiReasoning: '' }));
        setAiReasoning('');
    };

    const activeTasks = tasks.filter(t => !t.completedAt && t.type !== 'event');

    const today = new Date().toISOString().split('T')[0];
    const upcomingEvents = tasks
        .filter(t => t.type === 'event' && !t.completedAt && t.deadline >= today)
        .sort((a, b) => {
            if (a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
            return (a.time || '').localeCompare(b.time || '');
        });

    return (
        <div className="flex h-full gap-4 relative overflow-hidden">

            {/* Main Heatmap Area */}
            <div className="flex-grow flex flex-col h-full space-y-4 relative transition-all duration-300">
                <div className="flex justify-between items-end px-2 shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">מטריצת אייזנהאואר</h2>
                        <p className="text-xs text-slate-500 font-medium">עדיפות משימות לפי דחיפות וחשיבות</p>
                    </div>
                    <button
                        onClick={() => setIsScheduleOpen(!isScheduleOpen)}
                        aria-label={isScheduleOpen ? "סגור לוח זמנים" : "פתח לוח זמנים"}
                        className="p-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-500 transition-colors hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                        {isScheduleOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <div
                    ref={heatmapRef}
                    onClick={handleMapClick}
                    className="flex-grow relative bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden cursor-crosshair select-none group"
                >
                    <QuadrantBackground />

                    {/* Quick Add Form */}
                    {isAdding && (
                        <div 
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
                            onClick={(e) => {
                                if (e.target === e.currentTarget) {
                                    setIsAdding(false);
                                }
                            }}
                        >
                            <div
                                className={cn(
                                    "z-50 no-map-click bg-white shadow-2xl border border-slate-100 p-5 animate-in duration-200",
                                    "w-full max-w-md rounded-2xl zoom-in-95 origin-center slide-in-from-bottom-4",
                                    "max-h-[90vh] overflow-y-auto scrollbar-hide font-sans relative"
                                )}
                                style={{
                                    direction: 'rtl'
                                }}
                                onClick={(e) => e.stopPropagation()}
                            >
                            <button 
                                type="button" 
                                onClick={() => setIsAdding(false)} 
                                aria-label="סגור"
                                className="absolute left-3 top-3 text-slate-300 hover:text-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 rounded"
                            >
                                <X size={20} />
                            </button>

                            <form onSubmit={handleSave} className="space-y-4">

                                {/* Task Input */}
                                <div className="relative">
                                    <input
                                        autoFocus
                                        value={tempTask.text}
                                        onChange={e => setTempTask(prev => ({ ...prev, text: e.target.value }))}
                                        placeholder="משימה חדשה..."
                                        aria-label="טקסט המשימה"
                                        className="w-full text-xl font-bold border rounded-xl border-slate-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none py-3 px-4 pl-12 bg-white text-slate-800 placeholder:text-slate-300 text-right shadow-sm transition-all"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAiSuggest}
                                        disabled={aiAnalyzing}
                                        aria-label="הצע ניתוח AI"
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-violet-500 hover:bg-violet-50 p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                                    >
                                        {aiAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                                    </button>
                                </div>

                                {aiReasoning && (
                                    <div className="text-xs text-violet-600 bg-violet-50 p-2.5 rounded-xl border border-violet-100 animate-fadeIn leading-relaxed">
                                        🤖 {aiReasoning}
                                    </div>
                                )}

                                {/* Row 1: Time & Date */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-400 block text-right">זמן (דק&apos;)</label>
                                        <div className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-1 pl-2 pr-2 shadow-sm h-[42px] hover:border-blue-300 transition-colors">
                                            <button
                                                type="button"
                                                onClick={() => setTempTask(p => ({ ...p, duration: Math.max(15, p.duration - 15) }))}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                                            >
                                                <Minus size={16} />
                                            </button>
                                            <span className="text-lg font-bold text-slate-700 font-mono tracking-wider">
                                                {String(Math.floor(tempTask.duration / 60)).padStart(2, '0')}
                                                :
                                                {String(tempTask.duration % 60).padStart(2, '0')}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setTempTask(p => ({ ...p, duration: p.duration + 15 }))}
                                                className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all active:scale-95"
                                            >
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-slate-400 block text-right">תאריך יעד</label>
                                        <div className="relative">
                                            <CalendarIcon size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            <input
                                                type="date"
                                                value={tempTask.deadline}
                                                onChange={e => setTempTask(prev => ({ ...prev, deadline: e.target.value }))}
                                                className="w-full bg-white rounded-xl px-3 py-2 pr-9 text-sm text-slate-600 border border-slate-200 outline-none focus:border-blue-400 shadow-sm font-sans h-[42px]"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Domains */}
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(DOMAINS).map(([key, d]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setTempTask(prev => ({ ...prev, domain: key }))}
                                            className={cn(
                                                "h-9 rounded-lg text-xs font-bold transition-all border shadow-sm",
                                                tempTask.domain === key
                                                    ? `bg-white ${d.text} ${d.border} ring-2 ring-offset-1 ${d.ring}`
                                                    : "bg-slate-50 text-slate-400 border-slate-100 hover:bg-slate-100"
                                            )}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Row 3: Sliders */}
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">

                                    {/* Importance Slider (Right Side in RTL) */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-500 w-12 shrink-0">חשיבות</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="0.5"
                                            value={tempTask.importance}
                                            onChange={e => setTempTask(p => ({ ...p, importance: parseFloat(e.target.value) }))}
                                            className={cn("w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-blue-600")}
                                        />
                                        <span className="text-sm font-black text-blue-600 w-6 text-center">{tempTask.importance}</span>
                                    </div>

                                    {/* Urgency Slider (Left Side in RTL) */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-slate-500 w-12 shrink-0">דחיפות</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="5"
                                            step="0.5"
                                            value={tempTask.urgency}
                                            onChange={e => setTempTask(p => ({ ...p, urgency: parseFloat(e.target.value) }))}
                                            className={cn("w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-200 accent-rose-500")}
                                        />
                                        <span className="text-sm font-black text-rose-500 w-6 text-center">{tempTask.urgency}</span>
                                    </div>

                                </div>

                                <button 
                                    type="submit" 
                                    className="w-full bg-slate-900 hover:bg-black text-white py-3 rounded-xl text-sm font-bold shadow-lg shadow-slate-900/20 active:scale-[0.98] transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                                >
                                    הוסף למפה
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Tasks Only on Heatmap */}
                <div className="absolute inset-0 z-10 w-full h-full">
                        {activeTasks.map((task) => {
                            const bottomPct = ((task.importance - 1) * 0.25) * 80 + 10;
                            const leftPct = ((task.urgency - 1) * 0.25) * 80 + 10;
                            const isHovered = hoveredTask === task.id;
                            const isNearTop = task.importance > 4;

                            return (
                                <div
                                    key={task.id}
                                    className="no-map-click absolute transform -translate-x-[50%] translate-y-[50%] transition-all duration-300"
                                    style={{ bottom: bottomPct + '%', left: leftPct + '%' }}
                                    onMouseEnter={() => setHoveredTask(task.id)}
                                    onMouseLeave={() => setHoveredTask(null)}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTask(task);
                                    }}
                                >
                                    <div
                                        className={cn(
                                            "w-4 h-4 md:w-6 md:h-6 rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] border-2 border-white transition-all duration-300 cursor-pointer flex items-center justify-center",
                                            DOMAINS[task.domain]?.color || 'bg-slate-500',
                                            isHovered ? "scale-150 z-50 ring-4 ring-black/10" : "scale-100 z-20 hover:scale-110"
                                        )}
                                    >
                                        {isHovered && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                                    </div>

                                    {isHovered && !editingTask && (
                                        <div className={cn(
                                            "absolute left-[50%] -translate-x-[50%] w-48 bg-white/95 backdrop-blur border border-slate-200 text-slate-800 p-3 rounded-xl text-xs text-center shadow-2xl z-50 animate-in duration-200 pointer-events-none hidden md:block",
                                            isNearTop ? "top-8 slide-in-from-top-2" : "bottom-8 slide-in-from-bottom-2"
                                        )}>
                                            <div className="font-bold mb-1 text-sm">{task.text}</div>
                                            {task.deadline && (
                                                <div className="text-slate-500 mb-2 bg-slate-50 inline-block px-1.5 py-0.5 rounded">
                                                    <CalendarIcon size={12} className="inline mr-1" /> {new Date(task.deadline).toLocaleDateString('he')}
                                                </div>
                                            )}
                                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-700 pt-1">
                                                <span>⭐ {task.importance}</span>
                                                <span>🔥 {task.urgency}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Side Schedule Panel */}
            <div className={cn(
                "w-64 shrink-0 transition-all duration-300 flex flex-col gap-4 overflow-hidden absolute md:relative z-20 h-full bg-slate-100 md:bg-transparent right-0 shadow-xl md:shadow-none p-4 md:p-0",
                isScheduleOpen ? "translate-x-0 opacity-100" : "translate-x-[100%] md:translate-x-0 md:w-0 md:opacity-0 md:overflow-hidden"
            )}>
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2"><CalendarIcon size={16} /> לוח זמנים</h3>
                    <button 
                        onClick={() => setIsScheduleOpen(false)} 
                        aria-label="סגור לוח זמנים"
                        className="text-slate-400 hover:text-slate-600 md:hidden focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    >
                        <X size={16} />
                    </button>
                </div>

                <div className="flex-grow overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                    {upcomingEvents.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <p className="text-xs text-slate-400">אין אירועים קרובים</p>
                        </div>
                    ) : (
                        upcomingEvents.map(event => {
                            const EventIcon = EVENT_TYPES[event.eventType]?.icon || Clock;
                            const isEventToday = event.deadline === today;

                            return (
                                <div key={event.id} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm flex gap-3 relative overflow-hidden group hover:border-blue-200 transition-colors cursor-default">
                                    <div className={cn("absolute left-0 top-0 bottom-0 w-1", isEventToday ? "bg-blue-500" : "bg-slate-300")}></div>
                                    <div className="ml-2 flex flex-col items-center gap-1 text-slate-400 pt-0.5 min-w-[30px]">
                                        <EventIcon size={16} />
                                        <div className="text-[10px] font-mono text-center leading-tight">
                                            {event.startTime && event.endTime ? (
                                                <>
                                                    <div>{event.startTime}</div>
                                                    <div className="text-[8px] opacity-75">-</div>
                                                    <div>{event.endTime}</div>
                                                </>
                                            ) : (
                                                <div>{event.time || ''}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-grow min-w-0">
                                        <div className="text-xs font-bold text-slate-700 truncate">{event.text}</div>
                                        <div className="text-[10px] text-slate-400">
                                            {isEventToday ? 'היום' : new Date(event.deadline).toLocaleDateString('he-IL')} {' • '} {EVENT_TYPES[event.eventType]?.label}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {editingTask && (
                <EditTaskDialog
                    task={editingTask}
                    onClose={() => setEditingTask(null)}
                />
            )}
        </div>
    );
};
