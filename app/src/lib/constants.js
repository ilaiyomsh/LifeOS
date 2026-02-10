export const AREAS = {
  work: {
    id: 'work',
    label: 'עבודה',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    ring: 'ring-blue-500',
    dot: 'bg-blue-500',
  },
  school: {
    id: 'school',
    label: 'לימודים',
    color: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    ring: 'ring-purple-500',
    dot: 'bg-purple-500',
  },
  home: {
    id: 'home',
    label: 'בית',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    ring: 'ring-emerald-500',
    dot: 'bg-emerald-500',
  },
};

export const AREA_LIST = Object.values(AREAS);

export const STATUS_LABELS = {
  inbox: 'תיבת דואר',
  next_action: 'פעולה הבאה',
  waiting_for: 'ממתין ל...',
  someday: 'יום אחד/אולי',
  done: 'הושלם',
  trashed: 'נמחק',
};

export const PRIORITY_LABELS = {
  high: 'גבוהה',
  medium: 'בינונית',
  low: 'נמוכה',
};

export const PRIORITY_COLORS = {
  high: 'text-red-600',
  medium: 'text-amber-600',
  low: 'text-slate-400',
};
