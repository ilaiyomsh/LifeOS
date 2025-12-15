import React, { useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { X, Download, Trash2, RefreshCw } from 'lucide-react';

export const SettingsDialog = ({ onClose }) => {
    const { tasks, addTask, deleteTask } = useTasks();
    const [confirmReset, setConfirmReset] = useState(false);

    const handleExport = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "lifeos_backup_" + new Date().toISOString().split('T')[0] + ".json");
        document.body.appendChild(downloadAnchorNode); // required for firefox
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    const handleReset = () => {
        // Delete all tasks
        // Since context doesn't expose 'setTasks', we iterate delete (inefficient but safe with current context)
        // Or we can just clear Storage and reload
        localStorage.removeItem('lifeos-tasks');
        window.location.reload();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h2 className="text-lg font-black text-slate-800">הגדרות מערכת</h2>
                    <button 
                        onClick={onClose} 
                        aria-label="סגור הגדרות"
                        className="text-slate-400 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">

                    {/* Export Section */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-slate-700">גיבוי נתונים</h3>
                        <p className="text-xs text-slate-500">הורד קובץ גיבוי של כל המשימות שלך למחשב.</p>
                        <button
                            onClick={handleExport}
                            aria-label="הורד גיבוי נתונים"
                            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            <Download size={18} /> הורד גיבוי (JSON)
                        </button>
                    </div>

                    <hr className="border-slate-100" />

                    {/* Danger Zone */}
                    <div className="space-y-2">
                        <h3 className="text-sm font-bold text-red-600">אזור סכנה</h3>

                        {!confirmReset ? (
                            <button
                                onClick={() => setConfirmReset(true)}
                                aria-label="איפוס מערכת"
                                className="w-full flex items-center justify-center gap-2 border border-red-100 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-3 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
                            >
                                <Trash2 size={18} /> איפוס מערכת
                            </button>
                        ) : (
                            <div className="bg-red-50 p-3 rounded-xl border border-red-100 animate-in fade-in slide-in-from-top-2">
                                <p className="text-xs text-red-800 font-bold text-center mb-2">האם אתה בטוח? כל המשימות יימחקו!</p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setConfirmReset(false)}
                                        aria-label="ביטול איפוס"
                                        className="flex-1 bg-white border border-slate-200 text-slate-600 py-2 rounded-lg text-xs font-bold focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        ביטול
                                    </button>
                                    <button
                                        onClick={handleReset}
                                        aria-label="אישור מחיקת כל הנתונים"
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2"
                                    >
                                        כן, מחק הכל
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-mono">LifeOS V2.0 • Build 2025.12</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
