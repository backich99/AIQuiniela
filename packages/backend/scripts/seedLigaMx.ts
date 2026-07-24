import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

const ESPN_LIGA_MX_URL =
  'https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard';

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    competitors: Array<{
      homeAway: 'home' | 'away';
      team: { displayName: string };
    }>;
    status: { type: { state: string } };
  }>;
}

async function main() {
  console.log('⚽ Fetching Liga MX Apertura 2026 schedule from ESPN...');

  // Fetch entire apertura calendar (July to December 2026)
  const res = await fetch(`${ESPN_LIGA_MX_URL}?dates=20260701-20261231&limit=300`);
  if (!res.ok) {
    console.error('Failed to fetch:', res.status);
    return;
  }

  const data = (await res.json()) as { events: ESPNEvent[] };
  const events = data.events;
  console.log(`Found ${events.length} events from ESPN.`);

  if (events.length === 0) return;

  // Sort by date
  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group into jornadas (matchdays) — Liga MX has ~9 games per jornada
  // We'll group by clustering: events within 4 days of each other are the same jornada
  const jornadas: ESPNEvent[][] = [];
  let currentJornada: ESPNEvent[] = [events[0]];

  for (let i = 1; i < events.length; i++) {
    const prevDate = new Date(events[i - 1].date);
    const curDate = new Date(events[i].date);
    const diffDays = (curDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays > 4) {
      jornadas.push(currentJornada);
      currentJornada = [events[i]];
    } else {
      currentJornada.push(events[i]);
    }
  }
  jornadas.push(currentJornada);

  console.log(`Grouped into ${jornadas.length} jornadas.`);

  // Delete existing Liga MX matches
  await prisma.$executeRawUnsafe(`DELETE FROM "NflPrediction" WHERE "matchId" IN (SELECT id FROM "NflMatch" WHERE league = 'LIGA_MX')`);
  await prisma.$executeRawUnsafe(`DELETE FROM "NflResult" WHERE "matchId" IN (SELECT id FROM "NflMatch" WHERE league = 'LIGA_MX')`);
  await prisma.$executeRawUnsafe(`DELETE FROM "NflMatch" WHERE league = 'LIGA_MX'`);
  console.log('Cleared existing Liga MX matches.');

  // Insert matches
  let total = 0;
  for (let j = 0; j < jornadas.length; j++) {
    const week = j + 1;
    for (const event of jornadas[j]) {
      const comp = event.competitions[0];
      const home = comp.competitors.find(c => c.homeAway === 'home');
      const away = comp.competitors.find(c => c.homeAway === 'away');
      if (!home || !away) continue;

      await prisma.nflMatch.create({
        data: {
          espnEventId: event.id,
          homeTeam: home.team.displayName,
          awayTeam: away.team.displayName,
          week,
          league: 'LIGA_MX',
          startTime: new Date(event.date),
        },
      });
      total++;
    }
    console.log(`  Jornada ${week}: ${jornadas[j].length} partidos`);
  }

  console.log(`\n✅ Seeded ${total} Liga MX matches across ${jornadas.length} jornadas.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
