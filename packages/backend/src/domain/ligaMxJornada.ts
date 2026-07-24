/**
 * Determines the current Liga MX jornada number (1-17) based on today's date.
 * Apertura 2026 starts approximately July 11, 2026. Each jornada is ~1 week.
 */
export function getCurrentLigaMxJornada(): number {
  const JORNADA_1_START = new Date('2026-07-11T00:00:00Z');
  const now = new Date();

  if (now < JORNADA_1_START) return 1;

  const diffMs = now.getTime() - JORNADA_1_START.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const jornada = Math.floor(diffDays / 7) + 1;

  return Math.min(Math.max(jornada, 1), 17);
}
