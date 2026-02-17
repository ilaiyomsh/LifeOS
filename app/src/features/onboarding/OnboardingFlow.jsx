import { useState } from 'react';
import { Inbox, ListChecks, FolderKanban, RefreshCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';

const STEPS = [
  {
    icon: CheckCircle2,
    color: 'bg-blue-500',
    title: 'LifeOS',
    subtitle: 'מערכת ניהול משימות חכמה',
    description: 'מבוסס על שיטת GTD (Getting Things Done) — שיטה מוכחת לניהול זמן ומשימות.',
  },
  {
    icon: Inbox,
    color: 'bg-amber-500',
    title: 'תיבת דואר',
    subtitle: 'תעד הכל',
    description: 'כל רעיון, משימה או בקשה — קודם כל תעד אותם. אחר כך תעבד ותחליט מה לעשות.',
  },
  {
    icon: ListChecks,
    color: 'bg-emerald-500',
    title: 'פעולות',
    subtitle: 'התמקד במה שחשוב',
    description: 'בחר עד 3 משימות מיקוד ליום. ראה את הקיבולת שלך ואל תעמיס על עצמך.',
  },
  {
    icon: RefreshCw,
    color: 'bg-purple-500',
    title: 'סקירה שבועית',
    subtitle: 'שמור על סדר',
    description: '6 צעדים פשוטים לוודא שהמערכת עובדת. פעם בשבוע, 15 דקות.',
  },
];

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step === STEPS.length - 1) {
      localStorage.setItem('lifeos_onboarding_done', 'true');
      onComplete();
    } else {
      setStep(step + 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('lifeos_onboarding_done', 'true');
    onComplete();
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-950 flex flex-col">
      {/* Skip button */}
      <div className="flex justify-start p-4" style={{ paddingTop: 'calc(1rem + env(safe-area-inset-top, 0px))' }}>
        <button onClick={handleSkip} className="text-sm text-slate-400 dark:text-gray-500 active:text-slate-600 px-3 py-2">
          דלג
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div key={step} className="animate-scale-in">
          <div className={cn('w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8', current.color)}>
            <Icon size={36} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-2">{current.title}</h1>
          <p className="text-base font-medium text-slate-600 dark:text-gray-300 mb-4">{current.subtitle}</p>
          <p className="text-sm text-slate-500 dark:text-gray-400 max-w-[300px] mx-auto leading-relaxed">{current.description}</p>
        </div>
      </div>

      {/* Navigation */}
      <div className="px-6 pb-8" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {/* Dots */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all', i === step ? 'w-6 bg-slate-900 dark:bg-blue-500' : 'w-1.5 bg-slate-200 dark:bg-gray-700')} />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full py-3.5 bg-slate-900 dark:bg-blue-600 text-white rounded-2xl text-base font-semibold active:opacity-80 transition-colors flex items-center justify-center gap-2"
        >
          {step === STEPS.length - 1 ? 'בואו נתחיל!' : 'הבא'}
          {step < STEPS.length - 1 && <ArrowLeft size={18} />}
        </button>
      </div>
    </div>
  );
}
