/**
 * One-time script to link existing Match records with ESPN event IDs.
 * Fetches all World Cup events from ESPN and matches them by date + team names.
 *
 * Usage: npx tsx scripts/linkEspnEvents.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard';

// Map ESPN english team names to the Spanish names used in our DB
const TEAM_MAP: Record<string, string> = {
  'Mexico': 'México',
  'South Africa': 'Sudáfrica',
  'South Korea': 'República de Corea',
  'Czechia': 'República Checa',
  'Canada': 'Canadá',
  'Bosnia And Herzegovina': 'Bosnia y Herzegovina',
  'Bosnia-Herzegovina': 'Bosnia y Herzegovina',
  'United States': 'Estados Unidos',
  'Qatar': 'Catar',
  'Switzerland': 'Suiza',
  'Brazil': 'Brasil',
  'Morocco': 'Marruecos',
  'Haiti': 'Haití',
  'Scotland': 'Escocia',
  'Australia': 'Australia',
  'Turkey': 'Turquía',
  'Türkiye': 'Turquía',
  'Germany': 'Alemania',
  'Netherlands': 'Países Bajos',
  'Japan': 'Japón',
  'Ivory Coast': 'Costa de Marfil',
  "Côte d'Ivoire": 'Costa de Marfil',
  'Ecuador': 'Ecuador',
  'Sweden': 'Suecia',
  'Tunisia': 'Túnez',
  'Spain': 'España',
  'Cape Verde': 'Cabo Verde',
  'Belgium': 'Bélgica',
  'Egypt': 'Egipto',
  'Saudi Arabia': 'Arabia Saudí',
  'Uruguay': 'Uruguay',
  'Iran': 'Irán',
  'New Zealand': 'Nueva Zelanda',
  'France': 'Francia',
  'Senegal': 'Senegal',
  'Iraq': 'Irak',
  'Norway': 'Noruega',
  'Argentina': 'Argentina',
  'Algeria': 'Argelia',
  'Austria': 'Austria',
  'Jordan': 'Jordania',
  'Portugal': 'Portugal',
  'DR Congo': 'RD Congo',
  'Congo DR': 'RD Congo',
  'England': 'Inglaterra',
  'Croatia': 'Croacia',
  'Ghana': 'Ghana',
  'Panama': 'Panamá',
  'Uzbekistan': 'Uzbekistán',
  'Colombia': 'Colombia',
  'Paraguay': 'Paraguay',
  'Curaçao': 'Curazao',
  'Curacao': 'Curazao',
};

function normalize(name: string): string {
  return TEAM_MAP[name] || name;
}

async function main() {
  // Get all dates from the World Cup calendar
  const calRes = await fetch(ESPN_BASE);
  const calData = await calRes.json() as any;

  const dates: string[] = [];
  for (const entry of calData.leagues[0]?.calendar || []) {
    if (entry.entries) {
      // Get individual dates from the calendar range
      const start = new Date(entry.entries?.[0]?.startDate || entry.startDate);
      const end = new Date(entry.entries?.[entry.entries.length - 1]?.endDate || entry.endDate);
      let d = new Date(start);
      while (d <= end) {
        dates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
        d.setDate(d.getDate() + 1);
      }
    }
  }

  // Fetch scoreboards for each group stage date range (June 11-27)
  const groupDates: string[] = [];
  const start = new Date('2026-06-11');
  const end = new Date('2026-07-20');
  let d = new Date(start);
  while (d <= end) {
    groupDates.push(d.toISOString().slice(0, 10).replace(/-/g, ''));
    d.setDate(d.getDate() + 1);
  }

  let linked = 0;

  for (const date of groupDates) {
    const res = await fetch(`${ESPN_BASE}?dates=${date}`);
    const data = await res.json() as any;
    const events = data.events || [];

    for (const event of events) {
      const comp = event.competitions[0];
      const home = comp.competitors.find((c: any) => c.homeAway === 'home');
      const away = comp.competitors.find((c: any) => c.homeAway === 'away');

      const homeTeam = normalize(home.team.displayName);
      const awayTeam = normalize(away.team.displayName);

      // Find matching match in DB
      const match = await prisma.match.findFirst({
        where: { homeTeam, awayTeam, espnEventId: null },
      });

      if (match) {
        await prisma.match.update({
          where: { id: match.id },
          data: { espnEventId: event.id },
        });
        linked++;
        console.log(`✓ ${homeTeam} vs ${awayTeam} → ESPN ID ${event.id}`);
      } else {
        console.log(`✗ No match found for: ${homeTeam} vs ${awayTeam} (${home.team.displayName} vs ${away.team.displayName})`);
      }
    }

    // Small delay to not spam ESPN
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`\n✅ Linked ${linked} matches with ESPN event IDs.`);
}

main()
  .catch(console.error)
  .finally(() => process.exit());
