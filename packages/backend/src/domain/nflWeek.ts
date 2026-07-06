/**
 * Determines the current NFL week number (1-18) based on today's date.
 * Week 1 starts September 10, 2026. Each week is 7 days.
 */
export function getCurrentNflWeek(): number {
  const WEEK_1_START = new Date('2026-09-10T00:00:00Z');
  const now = new Date();

  if (now < WEEK_1_START) return 1;

  const diffMs = now.getTime() - WEEK_1_START.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;

  return Math.min(Math.max(week, 1), 18);
}
