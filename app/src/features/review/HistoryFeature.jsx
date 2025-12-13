import React from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS } from '../../lib/constants';
import { formatTime } from '../../lib/utils';
import { History, Calendar } from 'lucide-react';

export const HistoryFeature = () => {
    const { tasks } = useTasks();
    const completedTasks = tasks.filter(t => t.completedAt).sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    const totalTime = completedTasks.reduce((acc, t) => acc + (t.elapsedTime || 0), 0);

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <div className="text-3xl font-black text-slate-800">{completedTasks.length}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">משימות הושלמו</div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
                    <div className="text-3xl font-black text-blue-600 font-mono">{Math.floor(totalTime / 60)}</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase mt-1">דקות במיקוד</div>
                </div>
            </div>

            <div className="flex-grow bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 p-3 border-b border-slate-200 font-bold text-slate-600 text-xs flex items-center gap-2">
                    <History size={14} /> היסטוריית פעילות
                </div>

                {completedTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-slate-400">
                        <Calendar size={32} className="mb-2 opacity-50" />
                        <p className="text-xs">עדיין לא הושלמו משימות</p>
                    </div>
                ) : (
                    <div className="overflow-y-auto divide-y divide-slate-100 flex-grow">
                        {completedTasks.map((task) => (
                            <div key={task.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="min-w-0 pr-2">
                                    <div className="font-bold text-slate-800 text-sm truncate">{task.text}</div>
                                    <div className="flex items-center gap-2 text-[10px] mt-1">
                                        <span className={`px-1.5 py-0.5 rounded-full ${DOMAINS[task.domain].bgLight} ${DOMAINS[task.domain].text} font-bold`}>
                                            {DOMAINS[task.domain].label}
                                        </span>
                                        <span className="text-slate-400">
                                            {new Date(task.completedAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-left shrink-0 pl-2 border-l border-slate-100">
                                    <div className="text-sm font-mono font-bold text-slate-700">{task.elapsedTime > 0 ? formatTime(task.elapsedTime) : '--:--'}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
