import { Share2, Briefcase, GraduationCap, Home, Heart, PartyPopper, Dumbbell, Stethoscope, Calendar } from 'lucide-react';

export const DOMAINS = {
    work: {
        id: 'work',
        label: 'עבודה',
        color: 'bg-blue-500',
        text: 'text-blue-600',
        stroke: 'stroke-blue-600',
        border: 'border-blue-200',
        bgLight: 'bg-blue-50',
        ring: 'ring-blue-500'
    },
    study: {
        id: 'study',
        label: 'לימודים',
        color: 'bg-purple-500',
        text: 'text-purple-600',
        stroke: 'stroke-purple-600',
        border: 'border-purple-200',
        bgLight: 'bg-purple-50',
        ring: 'ring-purple-500'
    },
    household: {
        id: 'household',
        label: 'בית',
        color: 'bg-emerald-500',
        text: 'text-emerald-600',
        stroke: 'stroke-emerald-600',
        border: 'border-emerald-200',
        bgLight: 'bg-emerald-50',
        ring: 'ring-emerald-500'
    },
    family: {
        id: 'family',
        label: 'משפחה/חברים',
        color: 'bg-rose-500',
        text: 'text-rose-600',
        stroke: 'stroke-rose-600',
        border: 'border-rose-200',
        bgLight: 'bg-rose-50',
        ring: 'ring-rose-500'
    },
};

export const TABS = {
    PLAN: 'plan',
    CALENDAR: 'calendar',
    EXECUTE: 'execute',
    REVIEW: 'review',
};

export const EVENT_TYPES = {
    meeting: { label: 'פגישה', icon: Briefcase },
    lecture: { label: 'הרצאה', icon: GraduationCap },
    workout: { label: 'אימון', icon: Dumbbell },
    social: { label: 'אירוע', icon: PartyPopper },
    health: { label: 'בריאות', icon: Stethoscope },
    other: { label: 'כללי', icon: Calendar }
};

export const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
