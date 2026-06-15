import { prisma } from '../lib/prisma.js';

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

interface LiveScore {
  espnEventId: string;
  homeScore: number;
  awayScore: number;
  clock: string;
  status: 'in' | 'half' | 'post' | 'pre';
}

let cache: { data: LiveScore[]; ts: number } = { data: [], ts: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function getLiveScores(): Promise<LiveScore[]> {
  if (Date.now() - cache.ts < CACHE_TTL) return cache.data;

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
  // Also check yesterday for late-night UTC games
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10).replace(/-/g, '');

  const scores: LiveScore[] = [];

  for (const date of [yesterdayStr, dateStr]) {
    const res = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${date}`);
    if (!res.ok) continue;
    const data = (await res.json()) as any;

    for (const event of data.events || []) {
      const comp = event.competitions[0];
      const state = comp.status.type.state;
      if (state === 'pre') continue;

      const home = comp.competitors.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors.find((c: any) => c.homeAway === 'away');

      scores.push({
        espnEventId: event.id,
        homeScore: parseInt(home.score, 10),
        awayScore: parseInt(away.score, 10),
        clock: comp.status.displayClock || '',
        status: state === 'in' ? (comp.status.type.description === 'Halftime' ? 'half' : 'in') : state,
      });
    }
  }

  cache = { data: scores, ts: Date.now() };
  return scores;
}
