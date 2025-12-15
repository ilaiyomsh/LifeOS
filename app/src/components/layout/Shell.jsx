import React, { useState } from 'react';
import { BarChart2, Calendar, Play, History, PieChart, Settings, Trophy, List } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useTasks } from '../../contexts/TaskContext';
import { useGame } from '../../contexts/GameContext';
import { SettingsDialog } from '../ui/SettingsDialog';

const TABS = [
    { id: 'plan', label: 'תכנון', icon: BarChart2 },
    { id: 'calendar', label: 'לוח שנה', icon: Calendar },
    { id: 'schedule', label: 'לו״ז', icon: List }, // New tab
    { id: 'execute', label: 'ביצוע', icon: Play, isFab: true },
    { id: 'review', label: 'סקירה', icon: PieChart },
    { id: 'history', label: 'יומן', icon: History },
];

export const Shell = ({ children, activeTab, onTabChange }) => {
    const { activeTaskId } = useTasks();
    const { xp, level } = useGame();
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    return (
        <div className="min-h-screen bg-slate-100 font-sans text-slate-900 flex flex-col h-screen overflow-hidden" dir="rtl">
            {/* Header */}
            <header className="bg-slate-900 text-white p-3 px-4 shadow-lg shrink-0 flex justify-between items-center z-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-3">
                        <h1 className="text-lg font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-green-400">LifeOS V2.5</h1>
                        <button 
                            onClick={() => setIsSettingsOpen(true)} 
                            aria-label="הגדרות"
                            className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                        >
                            <Settings size={16} />
                        </button>
                    </div>
                    {/* XP Progress */}
                    <div className="flex items-center gap-2 text-[9px] text-slate-400 mt-0.5">
                        <span className="flex items-center gap-0.5 text-yellow-500 font-bold"><Trophy size={10} /> רמה {level}</span>
                        <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500" style={{ width: `${(xp % 1000) / 10}%` }}></div>
                        </div>
                    </div>
                </div>

                <div className={cn(
                    "text-[10px] font-mono px-2 py-1 rounded border border-slate-700 transition-colors",
                    activeTaskId ? "bg-red-500/20 text-red-200 border-red-500/50 animate-pulse" : "bg-slate-800 text-slate-300"
                )}>
                    {activeTaskId ? '● טיימר פעיל' : '○ המתנה'}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-4 overflow-hidden relative w-full max-w-2xl mx-auto flex flex-col">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-slate-200 pb-safe shadow-[0_-5px_20px_rgba(0,0,0,0.05)] shrink-0 z-20">
                <div className="flex justify-between items-center h-16 max-w-md mx-auto px-4">
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.id;

                        if (tab.isFab) {
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => onTabChange(tab.id)}
                                    aria-label={tab.label}
                                    aria-current={isActive ? 'page' : undefined}
                                    className="relative -top-5 group focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white rounded-full"
                                >
                                    <div className={cn(
                                        "w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all transform",
                                        isActive ? "bg-slate-900 ring-4 ring-blue-100 scale-110" : "bg-slate-800 group-hover:bg-slate-700",
                                        activeTaskId && "ring-2 ring-red-500 animate-pulse"
                                    )}>
                                        <tab.icon size={24} className="text-white ml-1" fill={isActive ? "currentColor" : "none"} />
                                    </div>
                                    <span className={cn(
                                        "absolute -bottom-4 w-full text-center text-[10px] font-bold transition-colors",
                                        isActive ? "text-slate-900" : "text-slate-400"
                                    )}>{tab.label}</span>
                                </button>
                            );
                        }

                        return (
                            <button
                                key={tab.id}
                                onClick={() => onTabChange(tab.id)}
                                aria-label={tab.label}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    "flex flex-col items-center justify-center w-14 h-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-white rounded-lg",
                                    isActive ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                            >
                                <div className={cn("p-1 rounded-lg transition-colors", isActive && "bg-blue-50")}>
                                    <tab.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="text-[9px] font-bold mt-0.5">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </nav>

            {isSettingsOpen && <SettingsDialog onClose={() => setIsSettingsOpen(false)} />}
        </div>
    );
};
