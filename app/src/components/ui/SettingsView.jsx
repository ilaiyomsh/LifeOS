import React from 'react';
import { Settings, Plus, X } from 'lucide-react';
import { useSettings } from '../../contexts/SettingsContext';

const DAYS_OF_WEEK = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

export default function SettingsView() {
    const { settings, updateSettings } = useSettings();
  
    // הגנה מפני קריסה אם הנתונים טרם נטענו
    if (!settings || !settings.workHours) {
        return <div className="p-4 text-center text-slate-500">טוען הגדרות...</div>;
    }

    // הוספת חלון זמן חדש ליום ספציפי
    const addBlock = (dayIndex) => {
        const newWorkHours = settings.workHours.map((day, i) => {
            if (i === dayIndex) {
                return { ...day, blocks: [...day.blocks, { start: "18:00", end: "20:00" }] };
            }
            return day;
        });
        updateSettings({ workHours: newWorkHours });
    };

    // מחיקת חלון זמן
    const removeBlock = (dayIndex, blockIndex) => {
        const newWorkHours = settings.workHours.map((day, i) => {
            if (i === dayIndex) {
                const newBlocks = day.blocks.filter((_, bi) => bi !== blockIndex);
                return { ...day, blocks: newBlocks };
            }
            return day;
        });
        updateSettings({ workHours: newWorkHours });
    };

    // עדכון שעות (התחלה/סיום)
    const updateBlock = (dayIndex, blockIndex, field, value) => {
        const newWorkHours = settings.workHours.map((day, i) => {
            if (i === dayIndex) {
                const newBlocks = day.blocks.map((block, bi) => {
                    if (bi === blockIndex) {
                        return { ...block, [field]: value };
                    }
                    return block;
                });
                return { ...day, blocks: newBlocks };
            }
            return day;
        });
        updateSettings({ workHours: newWorkHours });
    };

    // הפעלה/כיבוי של יום עבודה (יום חופש)
    const toggleDay = (dayIndex) => {
        const newWorkHours = settings.workHours.map((day, i) => {
            if (i === dayIndex) {
                return { ...day, isOff: !day.isOff };
            }
            return day;
        });
        updateSettings({ workHours: newWorkHours });
    };

    return (
        <div className="flex flex-col h-full space-y-4 overflow-y-auto pb-4" dir="rtl">
            
            {/* כותרת והסבר */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Settings size={20} className="text-slate-500" /> הגדרות זמינות
                </h2>
                <p className="text-xs text-slate-500 mb-4">
                    הגדר את חלונות הזמן בהם אתה זמין לעבודה. המערכת תשבץ משימות באופן אוטומטי רק בתוך החלונות הללו.
                </p>
                
                {/* רשימת הימים */}
                <div className="space-y-4">
                    {DAYS_OF_WEEK.map((day, index) => {
                        // Safe access using optional chaining
                        const config = settings.workHours[index] || { blocks: [], isOff: false };
                        const isDayOff = config.isOff;

                        return (
                            <div 
                                key={index} 
                                className={`p-3 rounded-lg border transition-all duration-200 ${isDayOff ? 'bg-slate-50 border-slate-100 opacity-70' : 'bg-white border-slate-200 shadow-sm'}`}
                            >
                                {/* שורת הכותרת של היום (צ'קבוקס + שם יום + כפתור הוספה) */}
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="checkbox" 
                                            checked={!isDayOff} 
                                            onChange={() => toggleDay(index)}
                                            className="w-4 h-4 accent-slate-900 cursor-pointer"
                                        />
                                        <span className={`text-sm font-bold ${isDayOff ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                            {day}
                                        </span>
                                    </div>
                                    
                                    {!isDayOff && (
                                        <button 
                                            onClick={() => addBlock(index)} 
                                            className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded-md flex items-center gap-1 transition-colors font-medium"
                                        >
                                            <Plus size={10} /> הוסף חלון
                                        </button>
                                    )}
                                </div>

                                {/* רשימת חלונות הזמן (Blocks) עבור אותו יום */}
                                {!isDayOff && (
                                    <div className="space-y-2 pr-7 border-r-2 border-slate-100 mr-1">
                                        {config.blocks && config.blocks.map((block, bIndex) => (
                                            <div key={bIndex} className="flex items-center gap-2 group">
                                                {/* שעת התחלה */}
                                                <input 
                                                    type="time" 
                                                    value={block.start} 
                                                    onChange={(e) => updateBlock(index, bIndex, 'start', e.target.value)}
                                                    className="text-xs border border-slate-300 rounded px-1 py-1 bg-white w-20 text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                                <span className="text-slate-400 text-xs font-medium">-</span>
                                                {/* שעת סיום */}
                                                <input 
                                                    type="time" 
                                                    value={block.end} 
                                                    onChange={(e) => updateBlock(index, bIndex, 'end', e.target.value)}
                                                    className="text-xs border border-slate-300 rounded px-1 py-1 bg-white w-20 text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                />
                                                
                                                {/* כפתור מחיקה (מופיע רק אם יש יותר מבלוק אחד) */}
                                                {config.blocks.length > 1 && (
                                                    <button 
                                                        onClick={() => removeBlock(index, bIndex)} 
                                                        className="text-slate-300 hover:text-red-500 transition-colors p-1"
                                                        title="מחק חלון זמן"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {isDayOff && (
                                    <div className="pr-7 text-xs text-slate-400 italic">יום חופש (לא ישובצו משימות)</div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

