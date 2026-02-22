import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, X, Timer, Coffee, Check } from 'lucide-react';
import { cn, lockBodyScroll, unlockBodyScroll } from '../../lib/utils';
import * as localDb from '../../lib/localDb';

const PRESETS = {
  pomodoro: { work: 25, break: 5, label: 'פומודורו' },
  long: { work: 50, break: 10, label: '50/10' },
  short: { work: 15, break: 3, label: 'קצר' },
};

export default function FocusTimer({ task, onClose, onComplete }) {
  const [preset, setPreset] = useState('pomodoro');
  const [phase, setPhase] = useState('work'); // 'work' | 'break'
  const [timeLeft, setTimeLeft] = useState(PRESETS.pomodoro.work * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCount, setSessionsCount] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => { lockBodyScroll(); return unlockBodyScroll; }, []);

  const config = PRESETS[preset];
  const totalSeconds = (phase === 'work' ? config.work : config.break) * 60;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          // Phase completed
          if (phase === 'work') {
            // Log session
            const duration = config.work;
            localDb.addFocusSession(task?.id || null, duration);
            setSessionsCount((c) => c + 1);
            // Vibrate
            if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            setPhase('break');
            return config.break * 60;
          } else {
            if (navigator.vibrate) navigator.vibrate(200);
            setPhase('work');
            return config.work * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [isRunning, phase, config, task?.id]);

  const toggleTimer = () => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setPhase('work');
    setTimeLeft(config.work * 60);
    startTimeRef.current = null;
  };

  const changePreset = (p) => {
    setPreset(p);
    setIsRunning(false);
    setPhase('work');
    setTimeLeft(PRESETS[p].work * 60);
    startTimeRef.current = null;
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden animate-scale-in',
        phase === 'work' ? 'bg-slate-900' : 'bg-emerald-800'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <h2 className="text-white font-semibold text-base">
              {phase === 'work' ? 'זמן עבודה' : 'הפסקה'}
            </h2>
            {task && <p className="text-white/60 text-xs mt-0.5 truncate max-w-[200px]">{task.title}</p>}
          </div>
          <button onClick={onClose} className="p-2 text-white/40 active:text-white/80 touch-target" aria-label="סגור">
            <X size={20} />
          </button>
        </div>

        {/* Presets */}
        <div className="flex gap-2 px-5 mb-6">
          {Object.entries(PRESETS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => changePreset(key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                preset === key
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50 active:bg-white/10'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Timer circle */}
        <div className="flex flex-col items-center px-5 pb-6">
          <div className="relative w-48 h-48 mb-6">
            {/* Background circle */}
            <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
              <circle
                cx="60" cy="60" r="54" fill="none"
                stroke={phase === 'work' ? '#60a5fa' : '#34d399'}
                strokeWidth="6"
                strokeDasharray={`${2 * Math.PI * 54}`}
                strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            {/* Time display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-white tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-white/40 text-xs mt-1 flex items-center gap-1">
                {phase === 'work' ? <Timer size={12} /> : <Coffee size={12} />}
                {phase === 'work' ? `עבודה ${config.work} דק׳` : `הפסקה ${config.break} דק׳`}
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={resetTimer}
              className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/60 active:bg-white/20 transition-colors"
              aria-label="איפוס"
            >
              <RotateCcw size={20} />
            </button>
            <button
              onClick={toggleTimer}
              className={cn(
                'w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg',
                isRunning
                  ? 'bg-white/20 text-white active:bg-white/30'
                  : 'bg-white text-slate-900 active:bg-white/90'
              )}
              aria-label={isRunning ? 'השהה' : 'התחל'}
            >
              {isRunning ? <Pause size={28} /> : <Play size={28} className="mr-[-2px]" />}
            </button>
            {task && onComplete && (
              <button
                onClick={() => { onComplete(task.id); onClose(); }}
                className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 active:bg-emerald-500/30 transition-colors"
                aria-label="סיים משימה"
              >
                <Check size={20} />
              </button>
            )}
          </div>

          {/* Session counter */}
          {sessionsCount > 0 && (
            <div className="mt-4 flex items-center gap-1.5">
              {Array.from({ length: sessionsCount }).map((_, i) => (
                <div key={i} className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              ))}
              <span className="text-white/40 text-xs mr-1">{sessionsCount} sessions</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
