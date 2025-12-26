import type { SectionInfo } from '../types';

export const POST_DURATION_DAYS = 7;
export const MAX_IMAGES = 6;

export const REACTIONS = [
  { key: 'hot', emoji: '🔥', label: 'hot' },
  { key: 'interested', emoji: '💰', label: 'interested' },
  { key: 'watching', emoji: '👀', label: 'watching' },
  { key: 'question', emoji: '❓', label: 'question' },
  { key: 'deal', emoji: '🤝', label: 'deal' },
] as const;

export const SECTIONS: SectionInfo[] = [
  { id: 'community', name: 'community', emoji: '🎨', color: 'from-pink-500 to-rose-500' },
  { id: 'for_sale', name: 'for sale', emoji: '🛍️', color: 'from-green-500 to-emerald-500' },
  { id: 'housing', name: 'housing', emoji: '🏠', color: 'from-blue-500 to-cyan-500' },
  { id: 'jobs', name: 'jobs', emoji: '💼', color: 'from-orange-500 to-red-500' },
  { id: 'services', name: 'services', emoji: '🔧', color: 'from-yellow-500 to-orange-500' },
  { id: 'gigs', name: 'gigs', emoji: '⚡', color: 'from-cyan-500 to-blue-500' },
  { id: 'discussion', name: 'discussion', emoji: '💭', color: 'from-purple-500 to-indigo-500' },
  { id: 'events', name: 'events', emoji: '🎉', color: 'from-red-500 to-pink-500' },
  { id: 'resumes', name: 'resumes', emoji: '📄', color: 'from-teal-500 to-green-500' },
];

export function formatTimeLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  if (days >= 1) return `${days}d ${remHours}h left`;
  return `${hours}h left`;
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
