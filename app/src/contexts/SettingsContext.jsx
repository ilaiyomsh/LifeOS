import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

const defaultSettings = {
    workHours: Array(7).fill(null).map(() => ({ 
        blocks: [{ start: "09:00", end: "17:00" }], 
        isOff: false 
    })),
    bufferTime: 5 // minutes between tasks
};

export const SettingsProvider = ({ children }) => {
    const [settings, setSettings] = useState(() => {
        const saved = localStorage.getItem('lifeos-settings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse settings:', e);
                return defaultSettings;
            }
        }
        return defaultSettings;
    });

    // Persistence
    useEffect(() => {
        localStorage.setItem('lifeos-settings', JSON.stringify(settings));
    }, [settings]);

    const updateSettings = (newSettings) => {
        setSettings(prev => ({ ...prev, ...newSettings }));
    };

    const getDayConfig = (dayIndex) => {
        if (dayIndex < 0 || dayIndex > 6) return null;
        return settings.workHours[dayIndex] || { blocks: [], isOff: true };
    };

    const value = {
        settings,
        updateSettings,
        getDayConfig
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
};

