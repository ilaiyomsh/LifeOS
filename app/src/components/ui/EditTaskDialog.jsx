import React, { useState, useEffect } from 'react';
import { DOMAINS } from '../../lib/constants';
import { X, Calendar as CalendarIcon, Trash2, Save } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../contexts/TaskContext';

export const EditTaskDialog = ({ task, onClose }) => {
    const { updateTask, deleteTask } = useTasks();
    const [editedTask, setEditedTask] = useState({ ...task });

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

                {/* Header with Domain Color */}
                <div className={`h-3 w-full ${DOMAINS[editedTask.domain].color}`}></div>

                <form onSubmit={handleSave} className="p-6 space-y-5">

                    <div className="flex justify-between items-start gap-4">
                        <input
                            value={editedTask.text}
                            onChange={e => setEditedTask({ ...editedTask, text: e.target.value })}
                            className="text-lg font-bold text-slate-800 border-b border-transparent focus:border-slate-300 outline-none w-full bg-transparent placeholder:text-slate-300"
                            placeholder="שם המשימה..."
                            autoFocus
                        />
                        <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Domain Selection */}
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
                                            ? `${d.bgLight} ${d.text} ${d.border} ring-1 ring-${d.ring.split('-')[1]}-500`
                                            : "bg-white border-slate-100 text-slate-300 hover:border-slate-200"
                                    )}
                                >
                                    <div className={`w-2.5 h-2.5 rounded-full ${d.color}`}></div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Sliders */}
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

                    {/* Deadline */}
                    <div className="relative">
                        <CalendarIcon size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            value={editedTask.deadline}
                            onChange={e => setEditedTask({ ...editedTask, deadline: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl py-2 pl-10 pr-4 outline-none focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleDelete}
                            className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            <Trash2 size={16} /> מחק
                        </button>
                        <button
                            type="submit"
                            className="flex-[2] bg-slate-900 text-white hover:bg-black py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 transition-transform active:scale-95"
                        >
                            <Save size={16} /> שמור שינויים
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};
