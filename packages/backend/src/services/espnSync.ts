import { prisma } from '../lib/prisma.js';
import { calculatePoints } from '../domain/scoring.js';

const ESPN_SCOREBOARD_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

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
 * Fetches World Cup results from ESPN and auto-registers
 * results for matches that have an espnEventId and are finished.
 * Also fixes any predictions with missing points (orphans).
 */
export async function syncResults(): Promise<{ synced: string[] }> {
  const pending = await prisma.match.findMany({
    where: {
      espnEventId: { not: null },
      startTime: { lte: new Date() },
      result: null,
    },
    select: { startTime: true },
  });

  const synced: string[] = [];

  if (pending.length > 0) {
    const dateSet = new Set(pending.map((m) => formatDate(m.startTime)));

    for (const date of dateSet) {
      const res = await fetch(`${ESPN_SCOREBOARD_URL}?dates=${date}`);
      if (!res.ok) continue;

      const data = (await res.json()) as { events: ESPNEvent[] };
      const finished = data.events.filter(
        (e) => e.competitions[0].status.type.state === 'post'
      );

      for (const event of finished) {
        const match = await prisma.match.findUnique({
          where: { espnEventId: event.id },
          include: { result: true },
        });

        if (!match || match.result) continue;

        const comp = event.competitions[0];
        const home = comp.competitors.find((c) => c.homeAway === 'home')!;
        const away = comp.competitors.find((c) => c.homeAway === 'away')!;
        const homeGoals = parseInt(home.score, 10);
        const awayGoals = parseInt(away.score, 10);

        await prisma.matchResult.create({
          data: { matchId: match.id, homeGoals, awayGoals },
        });

        await recalculate(match.id, homeGoals, awayGoals);
        synced.push(`${home.team.displayName} ${homeGoals}-${awayGoals} ${away.team.displayName}`);
      }
    }
  }

  // Fix predictions created after their match result was registered
  await recalculateOrphans();

  return { synced };
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

async function recalculate(matchId: string, homeGoals: number, awayGoals: number) {
  const predictions = await prisma.prediction.findMany({
    where: { matchId },
    include: { participant: { include: { pool: { include: { scoringRules: true } } } } },
  });

  for (const pred of predictions) {
    const rules = pred.participant.pool.scoringRules || {
      exactPoints: 5, partialPoints: 3, oneTeamPoints: 1,
    };
    const points = calculatePoints(
      { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals },
      { homeGoals, awayGoals },
      rules
    );
    await prisma.prediction.update({ where: { id: pred.id }, data: { pointsEarned: points } });
  }

  const participantIds = [...new Set(predictions.map((p) => p.participantId))];
  for (const pid of participantIds) {
    await recalculateParticipantTotals(pid);
  }
}

/**
 * Finds predictions with pointsEarned=null whose match already has a result,
 * and calculates their points.
 */
async function recalculateOrphans() {
  const orphans = await prisma.prediction.findMany({
    where: { pointsEarned: null, match: { result: { isNot: null } } },
    include: {
      match: { include: { result: true } },
      participant: { include: { pool: { include: { scoringRules: true } } } },
    },
  });

  if (orphans.length === 0) return;

  const affectedParticipants = new Set<string>();

  for (const pred of orphans) {
    const result = pred.match.result!;
    const rules = pred.participant.pool.scoringRules || {
      exactPoints: 5, partialPoints: 3, oneTeamPoints: 1,
    };
    const points = calculatePoints(
      { homeGoals: pred.homeGoals, awayGoals: pred.awayGoals },
      { homeGoals: result.homeGoals, awayGoals: result.awayGoals },
      rules
    );
    await prisma.prediction.update({ where: { id: pred.id }, data: { pointsEarned: points } });
    affectedParticipants.add(pred.participantId);
  }

  for (const pid of affectedParticipants) {
    await recalculateParticipantTotals(pid);
  }
}

async function recalculateParticipantTotals(participantId: string) {
  const allPreds = await prisma.prediction.findMany({
    where: { participantId, pointsEarned: { not: null } },
    include: { participant: { include: { pool: { include: { scoringRules: true } } } } },
  });

  const rules = allPreds[0]?.participant.pool.scoringRules || {
    exactPoints: 5, partialPoints: 3, oneTeamPoints: 1,
  };

  let totalPoints = 0, exactCount = 0, partialCount = 0;
  for (const p of allPreds) {
    totalPoints += p.pointsEarned!;
    if (p.pointsEarned === rules.exactPoints) exactCount++;
    else if (p.pointsEarned === rules.partialPoints) partialCount++;
  }

  const bonuses = await prisma.bonusPrediction.findMany({
    where: { participantId, pointsEarned: { not: null } },
  });
  for (const b of bonuses) totalPoints += b.pointsEarned!;

  await prisma.participant.update({
    where: { id: participantId },
    data: { totalPoints, exactCount, partialCount },
  });
}
