import React, { useState, useEffect } from 'react';
import { DOMAINS, EVENT_TYPES } from '../../lib/constants';
import { X, Calendar as CalendarIcon, Trash2, Save, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../contexts/TaskContext';

// Helper function to add minutes to time
const addMinutesToTime = (timeStr, minutes) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes, 0, 0);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const EditTaskDialog = ({ task, onClose }) => {
    const { updateTask, deleteTask } = useTasks();
    const [editedTask, setEditedTask] = useState(() => {
        // Initialize event with default time range if missing
        if (task.type === 'event') {
            return {
                ...task,
                startTime: task.startTime || task.time || '09:00',
                endTime: task.endTime || (task.time ? addMinutesToTime(task.time, 60) : '10:00'),
                eventType: task.eventType || 'other'
            };
        }
        return { ...task };
    });

    const handleSave = (e) => {
        e.preventDefault();
        updateTask(task.id, editedTask);
        onClose();
    };

    const handleDelete = () => {
        deleteTask(task.id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* Header with Domain Color or Event Type */}
                <div className={`h-3 w-full ${editedTask.type === 'event' ? 'bg-blue-500' : DOMAINS[editedTask.domain]?.color || 'bg-slate-500'}`}></div>

                <form onSubmit={handleSave} className="p-6 space-y-5">

                    <div className="flex justify-between items-start gap-4">
                        <input
                            value={editedTask.text}
                            onChange={e => setEditedTask({ ...editedTask, text: e.target.value })}
                            aria-label="שם המשימה"
                            className="text-lg font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none w-full bg-transparent placeholder:text-slate-300 focus:ring-2 focus:ring-blue-100 rounded"
                            placeholder="שם המשימה..."
                            autoFocus
                        />
                        <button 
                            type="button" 
                            onClick={onClose} 
                            aria-label="סגור"
                            className="text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Event Type Selection (for events) */}
                    {editedTask.type === 'event' ? (
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">סוג אירוע</label>
                            <div className="grid grid-cols-3 gap-2">
                                {Object.entries(EVENT_TYPES).map(([key, eventType]) => {
                                    const Icon = eventType.icon;
                                    return (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditedTask({ ...editedTask, eventType: key })}
                                            className={cn(
                                                "h-10 rounded-lg flex flex-col items-center justify-center gap-1 transition-all border text-xs font-bold",
                                                editedTask.eventType === key
                                                    ? "bg-blue-50 text-blue-600 border-blue-300 ring-2 ring-blue-200"
                                                    : "bg-white border-slate-100 text-slate-400 hover:border-slate-200"
                                            )}
                                        >
                                            <Icon size={16} />
                                            <span>{eventType.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* Domain Selection (for tasks) */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">תחום</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {Object.entries(DOMAINS).map(([key, d]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setEditedTask({ ...editedTask, domain: key })}
                                            className={cn(
                                                "h-8 rounded-lg flex items-center justify-center transition-all border",
                                                editedTask.domain === key
                                                    ? `${d.bgLight} ${d.text} ${d.border} ${d.ring} ring-1`
                                                    : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                            )}
                                        >
                                            <div className={`w-2.5 h-2.5 rounded-full ${d.color}`}></div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Sliders (for tasks) */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                        <span>חשיבות</span>
                                        <span className="text-blue-600">{editedTask.importance}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="5" step="0.5"
                                        value={editedTask.importance}
                                        onChange={e => setEditedTask({ ...editedTask, importance: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-blue-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                                        <span>דחיפות</span>
                                        <span className="text-pink-600">{editedTask.urgency}</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="5" step="0.5"
                                        value={editedTask.urgency}
                                        onChange={e => setEditedTask({ ...editedTask, urgency: Number(e.target.value) })}
                                        className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-pink-500"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    {/* Time Range (for events) */}
                    {editedTask.type === 'event' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 block text-right">שעת התחלה</label>
                                <div className="relative">
                                    <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={editedTask.startTime || editedTask.time || '09:00'}
                                        onChange={e => {
                                            const startTime = e.target.value;
                                            setEditedTask({ 
                                                ...editedTask, 
                                                startTime,
                                                time: startTime // Keep backward compatibility
                                            });
                                        }}
                                        aria-label="שעת התחלה"
                                        className="w-full bg-white rounded-xl px-3 py-2 pr-9 text-sm text-slate-600 border border-slate-200 outline-none focus:border-blue-400 shadow-sm font-sans h-[42px]"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-400 block text-right">שעת סיום</label>
                                <div className="relative">
                                    <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    <input
                                        type="time"
                                        value={editedTask.endTime || (editedTask.time ? addMinutesToTime(editedTask.time, 60) : '10:00')}
                                        onChange={e => setEditedTask({ ...editedTask, endTime: e.target.value })}
                                        aria-label="שעת סיום"
                                        className="w-full bg-white rounded-xl px-3 py-2 pr-9 text-sm text-slate-600 border border-slate-200 outline-none focus:border-blue-400 shadow-sm font-sans h-[42px]"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deadline */}
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                            <input
                                type="date"
                                value={editedTask.deadline}
                                onChange={e => setEditedTask({ ...editedTask, deadline: e.target.value })}
                                aria-label="תאריך יעד"
                                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                            />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            aria-label="מחק משימה"
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                        >
                            <Trash2 size={16} /> מחק
                        </button>
                        <button
                            type="submit"
                            aria-label="שמור שינויים"
                            className="flex-[2] bg-slate-900 text-white hover:bg-black py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-transform active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                        >
                            <Save size={16} /> שמור שינויים
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
