import React, { useMemo } from 'react';
import { useTasks } from '../../contexts/TaskContext';
import { DOMAINS } from '../../lib/constants';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const ReviewFeature = () => {
    const { tasks } = useTasks();

    const data = useMemo(() => {
        // Count tasks per domain (could also do time spent)
        const activeTasks = tasks.filter(t => !t.completedAt);
        const completedTasks = tasks.filter(t => t.completedAt);

        // Calculate Score: 1 point for active task, 1 point for completed task
        // Or better: Time spent per domain?
        // Let's do Balance of "Important" tasks per domain to see focus.

        const counts = { work: 0, study: 0, family: 0, household: 0 };

        // Aggregate completed time + active counts
        completedTasks.forEach(t => {
            if (counts[t.domain] !== undefined) counts[t.domain] += 1;
        });
        activeTasks.forEach(t => {
            if (counts[t.domain] !== undefined) counts[t.domain] += 0.5; // Weighted less
        });

        return Object.keys(DOMAINS).map(key => ({
            name: DOMAINS[key].label,
            value: counts[key] || 0.1, // Small buffer so chart isn't empty
            color: DOMAINS[key].color.replace('bg-', ''), // Hacky mapping, better to store explicit hex
            rawColor: DOMAINS[key].color
        }));
    }, [tasks]);

    // Helper to map Tailwind classes to Hex for Recharts (simplified approximation or using CSS variables would be better, but hardcoding for MVP speed)
    const COLORS = {
        work: '#3b82f6', // blue-500
        study: '#eab308', // yellow-500
        family: '#ef4444', // red-500
        household: '#22c55e', // green-500
    };

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-slate-800">איזון תחומי חיים</h2>
                <p className="text-xs text-slate-500 px-8">האם אתה מזניח תחום מסוים? (מבוסס על משימות לביצוע והיסטוריה)</p>
            </div>

            <div className="h-64 w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-4 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => {
                                const domainKey = Object.keys(DOMAINS).find(k => DOMAINS[k].label === entry.name);
                                return <Cell key={`cell-${index}`} fill={COLORS[domainKey]} stroke="none" />;
                            })}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800">{tasks.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">סה״כ משימות</span>
                </div>
            </div>

            {/* Legend / Action Items */}
            <div className="grid grid-cols-2 gap-3">
                {Object.entries(DOMAINS).map(([key, domain]) => (
                    <div key={key} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${domain.color}`}></div>
                            <span className="text-sm font-bold text-slate-700">{domain.label}</span>
                        </div>
                        {/* Basic Suggestion Logic */}
                        {(data.find(d => d.name === domain.label)?.value || 0) < 1 && (
                            <span className="text-[9px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">הזנחה!</span>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <h3 className="text-blue-900 font-bold text-sm mb-1">טיפ שבועי</h3>
                <p className="text-xs text-blue-700 leading-relaxed">
                    מומלץ לוודא שיש לך לפחות משימה אחת ב"רביע 2" (חשוב ולא דחוף) בתחום {Object.keys(DOMAINS)[Math.floor(Math.random() * 4)]}. זה הזמן לתכנן קדימה!
                </p>
            </div>
        </div>
    );
};
