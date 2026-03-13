import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score: number): string {
  if (score >= 75) return 'text-emerald-600';
  if (score >= 50) return 'text-amber-500';
  return 'text-red-500';
}

export function scoreBg(score: number): string {
  if (score >= 75) return 'bg-emerald-50 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function categoryColor(cat: string): string {
  const map: Record<string, string> = {
    cv:         'bg-blue-100 text-blue-700',
    portfolio:  'bg-purple-100 text-purple-700',
    jobsearch:  'bg-orange-100 text-orange-700',
    skills:     'bg-teal-100 text-teal-700',
  };
  return map[cat] ?? 'bg-gray-100 text-gray-700';
}

export function priorityColor(p: string): string {
  if (p === 'high') return 'bg-red-100 text-red-700';
  if (p === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-600';
}

export function statusColor(s: string): string {
  if (s === 'good') return 'text-emerald-600';
  if (s === 'needs-work') return 'text-amber-600';
  return 'text-red-500';
}
