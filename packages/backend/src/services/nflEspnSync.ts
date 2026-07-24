import { prisma } from '../lib/prisma.js';
import { calculateNflPoints } from '../domain/nflScoring.js';

const ESPN_NFL_URL =
  'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard';

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  score: string;
  team: { displayName: string };
}

interface ESPNEvent {
  id: string;
  competitions: Array<{
    competitors: ESPNCompetitor[];
    status: { type: { state: string } };
  }>;
}

/**
 * Fetches NFL results from ESPN and auto-registers results for
 * matches that have an espnEventId and are finished.
 */
export async function syncNflResults(): Promise<{ synced: string[] }> {
  const pending = await prisma.nflMatch.findMany({
    where: {
      espnEventId: { not: null },
      startTime: { lte: new Date() },
      result: null,
    },
    select: { startTime: true },
  });

  const synced: string[] = [];

  if (pending.length === 0) return { synced };

  const dateSet = new Set<string>();
  for (const m of pending) {
    dateSet.add(formatDate(m.startTime));
    // ESPN groups by ET date, which can be a day before UTC
    const prev = new Date(m.startTime);
    prev.setDate(prev.getDate() - 1);
    dateSet.add(formatDate(prev));
  }

  for (const date of dateSet) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${ESPN_NFL_URL}?dates=${date}&seasontype=2`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = (await res.json()) as { events: ESPNEvent[] };
      const finished = data.events.filter(
        (e) => e.competitions[0].status.type.state === 'post'
      );

      for (const event of finished) {
        const match = await prisma.nflMatch.findUnique({
          where: { espnEventId: event.id },
          include: { result: true },
        });

        if (!match || match.result) continue;

        const comp = event.competitions[0];
        const home = comp.competitors.find((c) => c.homeAway === 'home')!;
        const away = comp.competitors.find((c) => c.homeAway === 'away')!;
        const homeScore = parseInt(home.score, 10);
        const awayScore = parseInt(away.score, 10);

        await prisma.nflResult.create({
          data: { matchId: match.id, homeScore, awayScore },
        });

        await recalculateNflPoints(match.id);
        synced.push(
          `${home.team.displayName} ${homeScore}-${awayScore} ${away.team.displayName}`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`NFL ESPN sync error for date ${date}:`, message);
    }
  }

  return { synced };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * Recalculates points for all NFL predictions on a given match.
 * Updates pointsEarned on each NflPrediction and recalculates NflParticipant totals.
 */
export async function recalculateNflPoints(matchId: string): Promise<void> {
  const match = await prisma.nflMatch.findUnique({
    where: { id: matchId },
    include: { result: true },
  });

  if (!match?.result) return;

  const { homeScore, awayScore } = match.result;

  const predictions = await prisma.nflPrediction.findMany({
    where: { matchId },
  });

  for (const pred of predictions) {
    const points = calculateNflPoints({
      pick: pred.pick,
      homeScore,
      awayScore,
      league: match.league,
    });

    await prisma.nflPrediction.update({
      where: { id: pred.id },
      data: { pointsEarned: points },
    });
  }

  // Recalculate totals for affected participants
  const participantIds = [...new Set(predictions.map((p) => p.participantId))];

  for (const participantId of participantIds) {
    const allPreds = await prisma.nflPrediction.findMany({
      where: { participantId, pointsEarned: { not: null } },
    });

    const totalPoints = allPreds.reduce((sum, p) => sum + (p.pointsEarned ?? 0), 0);

    await prisma.nflParticipant.update({
      where: { id: participantId },
      data: { totalPoints },
    });
  }
}


const ESPN_LIGA_MX_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard';

/**
 * Fetches Liga MX results from ESPN and auto-registers results for
 * matches that have an espnEventId, league='LIGA_MX', and are finished.
 */
export async function syncLigaMxResults(): Promise<{ synced: string[] }> {
  const pending = await prisma.nflMatch.findMany({
    where: {
      league: 'LIGA_MX',
      espnEventId: { not: null },
      startTime: { lte: new Date() },
      result: null,
    },
    select: { startTime: true },
  });

  const synced: string[] = [];

  if (pending.length === 0) return { synced };

  const dateSet = new Set<string>();
  for (const m of pending) {
    dateSet.add(formatDate(m.startTime));
    const prev = new Date(m.startTime);
    prev.setDate(prev.getDate() - 1);
    dateSet.add(formatDate(prev));
  }

  for (const date of dateSet) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);

      const res = await fetch(`${ESPN_LIGA_MX_URL}?dates=${date}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) continue;

      const data = (await res.json()) as { events: ESPNEvent[] };
      const finished = data.events.filter(
        (e) => e.competitions[0].status.type.state === 'post'
      );

      for (const event of finished) {
        const match = await prisma.nflMatch.findUnique({
          where: { espnEventId: event.id },
          include: { result: true },
        });

        if (!match || match.result) continue;

        const comp = event.competitions[0];
        const home = comp.competitors.find((c) => c.homeAway === 'home')!;
        const away = comp.competitors.find((c) => c.homeAway === 'away')!;
        const homeScore = parseInt(home.score, 10);
        const awayScore = parseInt(away.score, 10);

        await prisma.nflResult.create({
          data: { matchId: match.id, homeScore, awayScore },
        });

        await recalculateNflPoints(match.id);
        synced.push(
          `${home.team.displayName} ${homeScore}-${awayScore} ${away.team.displayName}`
        );
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`Liga MX ESPN sync error for date ${date}:`, message);
    }
  }

  return { synced };
}
