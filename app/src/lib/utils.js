import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { GTD } from './constants';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
}

export function formatDateFull(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export function isOverdue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

export function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export function getTaskStaleness(task) {
  if (!task || task.status === 'done' || task.status === 'trashed') {
    return { isStale: false, daysSinceUpdate: 0, label: '' };
  }
  const threshold = GTD.STALE_THRESHOLDS[task.status];
  if (!threshold) return { isStale: false, daysSinceUpdate: 0, label: '' };

  const ref = task.updated_at || task.created_at;
  const days = Math.floor((Date.now() - new Date(ref).getTime()) / 86400000);
  const isStale = days >= threshold;
  return { isStale, daysSinceUpdate: days, label: isStale ? `ישן (${days} ימים)` : '' };
}

export function totalEstimatedMinutes(tasks) {
  return tasks.reduce((sum, t) => sum + (t.estimated_minutes || 0), 0);
}

export function formatMinutesAsHours(minutes) {
  const h = Math.round((minutes / 60) * 10) / 10;
  return `${h} שעות`;
}
