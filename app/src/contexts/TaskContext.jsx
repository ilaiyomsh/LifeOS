import React, { createContext, useContext, useState, useEffect } from 'react';
import { useGame } from './GameContext';

const TaskContext = createContext();

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks must be used within a TaskProvider');
    }
    return context;
};

export const TaskProvider = ({ children }) => {
    const { addXp } = useGame();

    const [tasks, setTasks] = useState(() => {
        // Load from local storage or default
        const saved = localStorage.getItem('lifeos-tasks');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: 'הגשת סמינריון', domain: 'study', importance: 5, urgency: 3, elapsedTime: 1200, completedAt: null, deadline: '2025-12-20' },
            { id: 2, text: 'קניות לבית', domain: 'household', importance: 3, urgency: 4, elapsedTime: 0, completedAt: null, deadline: '2025-12-14' },
            { id: 3, text: 'דייט שבועי', domain: 'family', importance: 5, urgency: 2, elapsedTime: 0, completedAt: null, deadline: '2025-12-18' },
        ];
    });

    const [activeTaskId, setActiveTaskId] = useState(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('lifeos-tasks', JSON.stringify(tasks));
    }, [tasks]);

    // Timer Logic
    useEffect(() => {
        let interval = null;
        if (activeTaskId) {
            interval = setInterval(() => {
                setTasks(prevTasks => prevTasks.map(t =>
                    t.id === activeTaskId ? { ...t, elapsedTime: (t.elapsedTime || 0) + 1 } : t
                ));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeTaskId]);

    const addTask = (task) => {
        setTasks(prev => [...prev, { ...task, id: Date.now(), elapsedTime: 0, completedAt: null }]);
    };

    const updateTask = (id, updates) => {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    };

    const deleteTask = (id) => {
        if (activeTaskId === id) setActiveTaskId(null);
        setTasks(prev => prev.filter(t => t.id !== id));
    };

    const toggleTimer = (id) => {
        setActiveTaskId(current => current === id ? null : id);
    };

    const completeTask = (id) => {
        const task = tasks.find(t => t.id === id);
        if (task && !task.completedAt) {
            const earnedXp = 50 + ((task.importance || 1) * (task.urgency || 1) * 10);
            addXp(earnedXp);

            setActiveTaskId(current => current === id ? null : current);
            setTasks(prev => prev.map(t =>
                t.id === id ? { ...t, completedAt: new Date().toISOString(), earnedXp } : t
            ));
        }
    };

    const snoozeTask = (id) => {
        setTasks(prev => prev.map(t => {
            if (t.id !== id) return t;

            const currentDeadline = t.deadline ? new Date(t.deadline) : new Date();
            const nextDay = new Date(currentDeadline);
            nextDay.setDate(nextDay.getDate() + 1);

            return { ...t, deadline: nextDay.toISOString().split('T')[0] };
        }));
    };

    const value = {
        tasks,
        activeTaskId,
        addTask,
        updateTask,
        deleteTask,
        toggleTimer,
        completeTask,
        snoozeTask
    };

    return (
        <TaskContext.Provider value={value}>
            {children}
        </TaskContext.Provider>
    );
};
