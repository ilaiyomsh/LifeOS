import React, { useMemo, useEffect, useState } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS } from '../../lib/constants';
import { formatTime } from '../../lib/utils';
import { Play, Pause, CheckCircle, Target, SkipForward, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

const CircularProgress = ({ progress, children, colorClass }) => {
    const radius = 120;
    const stroke = 12;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center">
            <svg height={radius * 2} width={radius * 2} className="rotate-[-90deg]">
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    className={`text-slate-100/10 transition-all duration-500`}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <circle
                    stroke="currentColor"
                    fill="transparent"
                    strokeWidth={stroke}
                    strokeDasharray={circumference + ' ' + circumference}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    className={`${colorClass} transition-all duration-500`}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col">
                {children}
            </div>
        </div>
    );
};

export const FocusFeature = () => {
    const { tasks, activeTaskId, toggleTimer, completeTask, snoozeTask } = useTasks();

    const sortedTasks = useMemo(() => {
        return tasks
            .filter(t => !t.completedAt)
            .sort((a, b) => {
                // Sophisticated scoring: 
                // 1. Due date proximity (highest weight)
                // 2. Importance * Urgency
                const now = new Date();
                const deadlineA = a.deadline ? new Date(a.deadline) : new Date(now.getFullYear() + 1, 0, 1);
                const deadlineB = b.deadline ? new Date(b.deadline) : new Date(now.getFullYear() + 1, 0, 1);

                const daysLeftA = (deadlineA - now) / (1000 * 60 * 60 * 24);
                const daysLeftB = (deadlineB - now) / (1000 * 60 * 60 * 24);

                // Lower days left = higher score
                const dateScoreA = daysLeftA < 0 ? 1000 : (100 / (daysLeftA + 1));
                const dateScoreB = daysLeftB < 0 ? 1000 : (100 / (daysLeftB + 1));

                const matrixScoreA = (a.importance * 1.5) + a.urgency;
                const matrixScoreB = (b.importance * 1.5) + b.urgency;

                return (dateScoreB + matrixScoreB) - (dateScoreA + matrixScoreA);
            });
    }, [tasks]);

    const activeTask = tasks.find(t => t.id === activeTaskId);

    const handleComplete = (id) => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#10b981', '#f59e0b']
        });
        completeTask(id);
    };

    // Mock progress for the visual (in real app, set goal duration)
    const progress = activeTask ? (activeTask.elapsedTime % 60) * (100 / 60) : 0;
    // Actually, let's make it a 25 min pomodoro progress
    const pomodoroProgress = activeTask ? Math.min(100, ((activeTask.elapsedTime || 0) / (25 * 60)) * 100) : 0;

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Active Task Card */}
            <div className={`relative rounded-3xl p-6 transition-all duration-500 shadow-2xl overflow-hidden min-h-[320px] flex flex-col items-center justify-center ${activeTask ? 'bg-slate-900 text-white' : 'bg-white border-2 border-dashed border-slate-200'}`}>

                {activeTask ? (
                    <>
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>

                        <div className="absolute top-4 right-4 animate-pulse">
                            <div className={`w-3 h-3 rounded-full ${DOMAINS[activeTask.domain].color} shadow-[0_0_15px_currentColor]`}></div>
                        </div>

                        <div className="z-10 flex flex-col items-center w-full">
                            <span className={`text-[10px] font-bold tracking-widest uppercase mb-4 opacity-70`}>מודול {DOMAINS[activeTask.domain].label}</span>

                            <h2 className="text-xl md:text-2xl font-black text-center mb-6 leading-tight max-w-xs">{activeTask.text}</h2>

                            <CircularProgress progress={pomodoroProgress} colorClass={DOMAINS[activeTask.domain]?.stroke || 'stroke-slate-600'}>
                                <div className="font-mono text-5xl font-black tracking-tighter tabular-nums drop-shadow-2xl">
                                    {formatTime(activeTask.elapsedTime || 0)}
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">זמן מיקוד</span>
                            </CircularProgress>

                            <div className="flex gap-4 mt-8 w-full justify-center">
                                <button
                                    onClick={() => toggleTimer(activeTask.id)}
                                    aria-label="עצור טיימר"
                                    className="group bg-slate-800 hover:bg-slate-700 p-4 rounded-xl transition-all active:scale-95 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                >
                                    <Pause size={24} className="text-white group-hover:text-yellow-400 transition-colors" fill="currentColor" />
                                </button>
                                <button
                                    onClick={() => handleComplete(activeTask.id)}
                                    aria-label="סיים משימה"
                                    className="group bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 p-4 rounded-xl shadow-lg shadow-green-900/20 active:scale-95 transition-all flex items-center gap-2 pr-6 pl-5 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                                >
                                    <CheckCircle size={24} className="text-white" />
                                    <span className="font-bold text-sm">סיים</span>
                                </button>
                            </div>
                        </div>

                        {/* Background ambiance */}
                        <div className={`absolute -bottom-20 -right-20 w-64 h-64 ${DOMAINS[activeTask.domain].color} opacity-10 blur-3xl rounded-full`}></div>
                        <div className={`absolute -top-20 -left-20 w-64 h-64 ${DOMAINS[activeTask.domain].color} opacity-10 blur-3xl rounded-full`}></div>
                    </>
                ) : (
                    <div className="text-center flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                            <Target className="text-slate-300" size={40} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700">מוכן להתמקד?</h3>
                        <p className="text-sm text-slate-400 max-w-[200px] mt-2">בחר את המשימה החשובה ביותר מהמטריצה למטה כדי להתחיל.</p>
                    </div>
                )}
            </div>

            {/* Task Queue */}
            <div className="flex items-center justify-between px-2 mt-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">הבא בתור</h3>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{sortedTasks.length} ממתינות</span>
            </div>

            <div className="flex-grow overflow-y-auto space-y-2 pr-1 pb-20 mask-bottom">
                {sortedTasks.map((task, idx) => {
                    if (task.id === activeTaskId) return null;
                    return (
                        <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-400 hover:shadow-md transition-all">
                            <div className="flex items-center gap-4 overflow-hidden flex-grow cursor-pointer" onClick={() => toggleTimer(task.id)}>
                                <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors shadow-sm ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                    {idx + 1}
                                </div>
                                <div className="min-w-0">
                                    <div className="font-bold text-slate-800 text-sm truncate group-hover:text-blue-600 transition-colors">{task.text}</div>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                                        <span className={`w-1.5 h-1.5 rounded-full ${DOMAINS[task.domain].color}`}></span>
                                        <span className="uppercase tracking-wide">{DOMAINS[task.domain].label}</span>
                                        {task.deadline && (
                                            <span>• {new Date(task.deadline).toLocaleDateString('he-IL', { day: 'numeric', month: 'numeric' })}</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                                {/* Snooze Button */}
                                <button
                                    onClick={(e) => { e.stopPropagation(); snoozeTask(task.id); }}
                                    aria-label="דחה משימה ביום אחד"
                                    className="p-2 rounded-full text-slate-400 hover:bg-amber-50 hover:text-amber-500 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-amber-400"
                                    title="דחה יום אחד"
                                >
                                    <Clock size={16} />
                                </button>

                                <button
                                    onClick={() => toggleTimer(task.id)}
                                    aria-label="הפעל טיימר"
                                    className="p-2 rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-blue-400"
                                >
                                    <Play size={16} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
