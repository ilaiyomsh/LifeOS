import React, { useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { Inbox, Plus, Edit2, Trash2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { EditTaskDialog } from '../../components/ui/EditTaskDialog';

export const InboxFeature = () => {
    const { tasks, addTask, deleteTask } = useTasks();
    const [newTaskText, setNewTaskText] = useState('');
    const [editingTask, setEditingTask] = useState(null);

    const inboxTasks = tasks.filter(t => !t.completedAt && !t.domain);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (!newTaskText.trim()) return;

        addTask({
            text: newTaskText,
            domain: null, // No domain yet
            importance: 3,
            urgency: 3,
            deadline: null,
            type: 'task'
        });
        setNewTaskText('');
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                            <Inbox className="text-blue-500" size={18} /> אינבוקס
                        </h2>
                        <p className="text-[10px] text-slate-500">משימות חדשות שמחכות למיון</p>
                    </div>
                </div>

                <form onSubmit={handleAddTask} className="flex gap-2">
                    <input
                        value={newTaskText}
                        onChange={e => setNewTaskText(e.target.value)}
                        placeholder="מה יש לך בראש?"
                        className="flex-grow text-sm px-4 py-2 rounded-lg border border-slate-200 focus:border-blue-400 outline-none transition-all"
                        autoFocus
                    />
                    <button
                        type="submit"
                        aria-label="הוסף לאינבוקס"
                        className="bg-slate-900 text-white p-2 rounded-lg hover:bg-black transition-colors shadow-md active:scale-95"
                    >
                        <Plus size={20} />
                    </button>
                </form>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 pb-4">
                {inboxTasks.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Inbox size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">האינבוקס ריק!</p>
                        <p className="text-xs text-slate-400 mt-2">כל מה שעולה לך לראש, זרוק לכאן.</p>
                    </div>
                ) : (
                    inboxTasks.map((task) => (
                        <div 
                            key={task.id} 
                            className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-400 transition-all cursor-pointer"
                            onClick={() => setEditingTask(task)}
                        >
                            <div className="font-bold text-slate-800 text-sm truncate">{task.text}</div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTask(task);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm('האם אתה בטוח שברצונך למחוק?')) {
                                            deleteTask(task.id);
                                        }
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
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
