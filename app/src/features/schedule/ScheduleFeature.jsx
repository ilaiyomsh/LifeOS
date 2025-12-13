import React, { useState, useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS, API_KEY } from '../../lib/constants';
import { optimizeScheduleWithAI } from '../../lib/ai';
import { Sun, Sparkles, Loader2 } from 'lucide-react';

const addMinutesToTime = (timeStr, minutesToAdd) => {
    const [hours, mins] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutesToAdd, 0, 0);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
};

export const ScheduleFeature = () => {
    const { tasks, updateTask, tasks: allTasks } = useTasks();

    const [startTime, setStartTime] = useState('08:00');
    const [isOptimizing, setIsOptimizing] = useState(false);

    const todaysTasks = useMemo(() => {
        return tasks.filter(t => !t.completedAt && t.type !== 'event');
    }, [tasks]);

    const sortedSchedule = useMemo(() => {
        return [...todaysTasks].sort((a, b) => {
            if (a.scheduleOrder !== undefined && b.scheduleOrder !== undefined) return a.scheduleOrder - b.scheduleOrder;
            return b.importance - a.importance;
        });
    }, [todaysTasks]);

    let currentTime = startTime;
    const scheduleItems = sortedSchedule.map(task => {
        const start = currentTime;
        const end = addMinutesToTime(currentTime, task.duration || 60);
        currentTime = end;
        return { ...task, start, end };
    });

    const handleAiOptimize = async () => {
        setIsOptimizing(true);

        if (!API_KEY) {
            alert('API Key missing');
            setIsOptimizing(false);
            return;
        }

        try {
            const orderIds = await optimizeScheduleWithAI(todaysTasks, startTime, API_KEY);

            // Update tasks order
            orderIds.forEach((id, index) => {
                updateTask(id, { scheduleOrder: index });
            });

        } catch (e) {
            console.error("Optimize failed", e);
            alert("Optimization failed");
        } finally {
            setIsOptimizing(false);
        }
    };

    return (
        <div className="flex flex-col h-full space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 shrink-0">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base">
                            <Sun className="text-orange-500" size={18} /> Daily Schedule
                        </h2>
                        <p className="text-[10px] text-slate-500">Optimized plan for today</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                        <label className="text-[10px] font-bold text-slate-500">Start:</label>
                        <input
                            type="time"
                            value={startTime}
                            onChange={(e) => setStartTime(e.target.value)}
                            className="bg-transparent text-sm font-mono font-bold text-slate-800 outline-none w-16"
                        />
                    </div>
                </div>

                <button
                    onClick={handleAiOptimize}
                    disabled={isOptimizing}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-2 rounded-lg text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                    {isOptimizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    Auto-Schedule with Gemini
                </button>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 relative pb-4">
                <div className="absolute top-0 bottom-0 right-[19px] w-0.5 bg-slate-200 z-0"></div>

                {scheduleItems.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 flex flex-col items-center">
                        <Sun size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">No active tasks for today.</p>
                    </div>
                ) : scheduleItems.map((item) => (
                    <div key={item.id} className="relative z-10 flex gap-3 group animate-fadeIn">
                        <div className="flex flex-col items-center min-w-[40px] pt-1">
                            <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-1 rounded">{item.start}</span>
                        </div>

                        <div className={`flex-grow p-3 rounded-xl border-l-4 shadow-sm bg-white mb-1 ${DOMAINS[item.domain]?.border ? DOMAINS[item.domain].border.replace('border-', 'border-l-') : 'border-l-slate-200'} active:scale-[0.99] transition-transform`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${DOMAINS[item.domain]?.bgLight} ${DOMAINS[item.domain]?.text} font-bold`}>
                                        {DOMAINS[item.domain]?.label}
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-sm mt-1 line-clamp-1">{item.text}</h3>
                                </div>
                                <div className="text-right min-w-[50px]">
                                    <span className="text-[10px] text-slate-400 block font-mono">{item.duration || 60}m</span>
                                    <span className="text-[9px] text-slate-300 block mt-0.5">until {item.end}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
