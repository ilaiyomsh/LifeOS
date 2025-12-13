import React, { createContext, useContext, useState, useEffect } from 'react';

const GameContext = createContext();

export const useGame = () => useContext(GameContext);

export const GameProvider = ({ children }) => {
    const [xp, setXp] = useState(() => {
        const saved = localStorage.getItem('lifeos_xp');
        return saved ? parseInt(saved, 10) : 1250;
    });

    const [level, setLevel] = useState(1);

    useEffect(() => {
        localStorage.setItem('lifeos_xp', xp.toString());
        setLevel(Math.floor(xp / 1000) + 1);
    }, [xp]);

    const addXp = (amount) => {
        setXp(prev => prev + amount);
    };

    return (
        <GameContext.Provider value={{ xp, level, addXp }}>
            {children}
        </GameContext.Provider>
    );
};
