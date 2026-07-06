import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

// NFL 2026 Regular Season - 32 teams, 18 weeks, 272 total games (each team plays 17, 1 bye)
// Week 1 starts Thursday September 10, 2026
// Times: Thursday Night 8:20pm ET, Sunday Early 1:00pm ET, Sunday Late 4:25pm ET,
//        Sunday Night 8:20pm ET, Monday Night 8:15pm ET
// ET = UTC-4 (summer/EDT), ET = UTC-5 (after DST ends first Sunday of November = Nov 1, 2026)

const ALL_TEAMS = [
  'Chiefs', 'Eagles', 'Bills', '49ers', 'Cowboys', 'Lions', 'Ravens', 'Bengals',
  'Dolphins', 'Jets', 'Commanders', 'Packers', 'Buccaneers', 'Texans', 'Browns', 'Bears',
  'Seahawks', 'Jaguars', 'Steelers', 'Chargers', 'Vikings', 'Broncos', 'Colts', 'Saints',
  'Falcons', 'Raiders', 'Cardinals', 'Giants', 'Titans', 'Panthers', 'Patriots', 'Rams',
] as const;

type Team = typeof ALL_TEAMS[number];

interface NflGame {
  homeTeam: Team;
  awayTeam: Team;
  week: number;
  startTime: Date;
}

/**
 * Convert Eastern Time to UTC.
 * EDT (UTC-4) applies until first Sunday of November 2026 (Nov 1).
 * EST (UTC-5) applies from Nov 1, 2026 onward.
 */
function etToUtc(dateStr: string, hours: number, minutes: number): Date {
  const d = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  // DST ends Nov 1, 2026 at 2:00 AM ET
  const dstEnd = new Date('2026-11-01T06:00:00Z'); // Nov 1 2:00am ET = 6:00 UTC
  if (d < dstEnd) {
    // EDT: UTC-4, so add 4 hours
    d.setUTCHours(d.getUTCHours() + 4);
  } else {
    // EST: UTC-5, so add 5 hours
    d.setUTCHours(d.getUTCHours() + 5);
  }
  return d;
}

// Helper: get the date string for a week's Thursday, Sunday, and Monday
function getWeekDates(weekNum: number): { thursday: string; sunday: string; monday: string } {
  // Week 1 Thursday = September 10, 2026
  const week1Thursday = new Date('2026-09-10');
  const offset = (weekNum - 1) * 7;
  const thursday = new Date(week1Thursday);
  thursday.setDate(thursday.getDate() + offset);
  const sunday = new Date(thursday);
  sunday.setDate(sunday.getDate() + 3);
  const monday = new Date(thursday);
  monday.setDate(monday.getDate() + 4);

  const fmt = (d: Date) => d.toISOString().split('T')[0];
  return { thursday: fmt(thursday), sunday: fmt(sunday), monday: fmt(monday) };
}

// Generate all 272 games with realistic scheduling
// Each team plays 17 games with 1 bye week
function generateSchedule(): NflGame[] {
  const games: NflGame[] = [];

  // Pre-defined schedule: 18 weeks of matchups ensuring each team plays exactly 17 games
  // Bye weeks are distributed across weeks 5-14 (2 teams per bye week = 20 bye slots for 32 teams with 1 bye each = 32 byes)
  // Actually: 32 teams * 1 bye = 32 bye-game-slots. With ~16 games/week normally, a bye week has 14-15 games.
  // 18 weeks * 16 games = 288 slots, but 272 actual games + 32 byes/2 per team-week = works out.

  // Schedule structure: weeks 1-4 and 15-18 have 16 games (all teams play).
  // Weeks 5-14 have varying games (some teams on bye).
  // 32 byes distributed: weeks 5-14 = 10 weeks, ~3-4 byes per week → ~14-15 games per week

  // Matchup definitions per week (home, away pairs using team indices 0-31)
  const weekMatchups: [number, number][][] = [
    // Week 1: 16 games (all 32 teams)
    [[0,1],[2,3],[4,5],[6,7],[8,9],[10,11],[12,13],[14,15],[16,17],[18,19],[20,21],[22,23],[24,25],[26,27],[28,29],[30,31]],
    // Week 2: 16 games
    [[1,2],[3,4],[5,6],[7,8],[9,10],[11,12],[13,14],[15,16],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[31,0]],
    // Week 3: 16 games
    [[0,3],[1,5],[2,7],[4,9],[6,11],[8,13],[10,15],[12,17],[14,19],[16,21],[18,23],[20,25],[22,27],[24,29],[26,31],[28,30]],
    // Week 4: 16 games
    [[3,0],[5,1],[7,2],[9,4],[11,6],[13,8],[15,10],[17,12],[19,14],[21,16],[23,18],[25,20],[27,22],[29,24],[31,26],[30,28]],
    // Week 5: 14 games (teams 0,1,2,3 on bye)
    [[4,7],[5,8],[6,9],[10,13],[11,14],[12,15],[16,19],[17,20],[18,21],[22,25],[23,26],[24,27],[28,31],[29,30]],
    // Week 6: 14 games (teams 4,5,6,7 on bye)
    [[0,9],[1,10],[2,11],[3,12],[8,13],[14,17],[15,18],[16,20],[19,22],[21,24],[23,27],[25,28],[26,29],[30,31]],
    // Week 7: 14 games (teams 8,9,10,11 on bye)
    [[0,5],[1,6],[2,12],[3,13],[4,14],[7,15],[16,22],[17,23],[18,24],[19,25],[20,26],[21,27],[28,30],[29,31]],
    // Week 8: 14 games (teams 12,13,14,15 on bye)
    [[0,7],[1,8],[2,9],[3,10],[4,11],[5,16],[6,17],[18,25],[19,26],[20,27],[21,28],[22,29],[23,30],[24,31]],
    // Week 9: 14 games (teams 16,17,18,19 on bye)
    [[0,11],[1,12],[2,13],[3,14],[4,15],[5,20],[6,21],[7,22],[8,23],[9,24],[10,25],[26,30],[27,31],[28,29]],
    // Week 10: 14 games (teams 20,21,22,23 on bye)
    [[0,13],[1,14],[2,15],[3,16],[4,17],[5,18],[6,19],[7,24],[8,25],[9,26],[10,27],[11,28],[12,29],[30,31]],
    // Week 11: 14 games (teams 24,25,26,27 on bye)
    [[0,15],[1,16],[2,17],[3,18],[4,19],[5,20],[6,22],[7,23],[8,28],[9,29],[10,30],[11,31],[12,21],[13,14]],
    // Week 12: 14 games (teams 28,29,30,31 on bye)
    [[0,21],[1,22],[2,23],[3,24],[4,25],[5,26],[6,27],[7,16],[8,17],[9,18],[10,19],[11,20],[12,14],[13,15]],
    // Week 13: 16 games (all play - some teams' 2nd round matchups)
    [[1,0],[3,2],[5,4],[7,6],[9,8],[11,10],[13,12],[15,14],[17,16],[19,18],[21,20],[23,22],[25,24],[27,26],[29,28],[31,30]],
    // Week 14: 16 games
    [[0,2],[1,3],[4,6],[5,7],[8,10],[9,11],[12,14],[13,15],[16,18],[17,19],[20,22],[21,23],[24,26],[25,27],[28,30],[29,31]],
    // Week 15: 16 games
    [[2,0],[4,1],[6,3],[8,5],[10,7],[12,9],[14,11],[16,13],[18,15],[20,17],[22,19],[24,21],[26,23],[28,25],[30,27],[31,29]],
    // Week 16: 16 games
    [[0,4],[1,7],[2,6],[3,5],[8,12],[9,15],[10,14],[11,13],[16,20],[17,23],[18,22],[19,21],[24,28],[25,31],[26,30],[27,29]],
    // Week 17: 16 games
    [[4,0],[6,2],[5,3],[7,1],[12,8],[14,10],[13,11],[15,9],[20,16],[22,18],[21,19],[23,17],[28,24],[30,26],[29,27],[31,25]],
    // Week 18: 16 games
    [[0,6],[1,4],[2,5],[3,7],[8,14],[9,12],[10,13],[11,15],[16,23],[17,22],[18,20],[19,21],[24,30],[25,29],[26,28],[27,31]],
  ];

  // Validate: check total games = 272
  const totalGames = weekMatchups.reduce((sum, week) => sum + week.length, 0);
  if (totalGames !== 272) {
    throw new Error(`Schedule has ${totalGames} games, expected 272`);
  }

  // Validate: each team plays exactly 17 games
  const teamGameCount = new Array(32).fill(0);
  for (const weekGames of weekMatchups) {
    for (const [home, away] of weekGames) {
      teamGameCount[home]++;
      teamGameCount[away]++;
    }
  }
  for (let i = 0; i < 32; i++) {
    if (teamGameCount[i] !== 17) {
      throw new Error(`Team ${ALL_TEAMS[i]} (idx ${i}) has ${teamGameCount[i]} games, expected 17`);
    }
  }

  // Assign game times for each week
  for (let weekIdx = 0; weekIdx < weekMatchups.length; weekIdx++) {
    const weekNum = weekIdx + 1;
    const { thursday, sunday, monday } = getWeekDates(weekNum);
    const matchups = weekMatchups[weekIdx];
    const numGames = matchups.length;

    // Time slot distribution:
    // 1 Thursday Night (8:20pm ET)
    // ~10-11 Sunday Early (1:00pm ET)
    // ~2-3 Sunday Late (4:25pm ET)
    // 1 Sunday Night (8:20pm ET)
    // 1 Monday Night (8:15pm ET)
    // Total varies: 14 or 16

    const slots: { date: string; hours: number; minutes: number }[] = [];

    // Thursday Night Football
    slots.push({ date: thursday, hours: 20, minutes: 20 });

    // Determine remaining games for Sun/Mon
    const remaining = numGames - 1; // minus Thursday
    const mondayCount = 1;
    const sundayNightCount = 1;
    const sundayLateCount = Math.min(3, remaining - mondayCount - sundayNightCount - 1);
    const sundayEarlyCount = remaining - mondayCount - sundayNightCount - sundayLateCount;

    // Sunday Early 1:00pm ET
    for (let i = 0; i < sundayEarlyCount; i++) {
      slots.push({ date: sunday, hours: 13, minutes: 0 });
    }

    // Sunday Late 4:25pm ET
    for (let i = 0; i < sundayLateCount; i++) {
      slots.push({ date: sunday, hours: 16, minutes: 25 });
    }

    // Sunday Night 8:20pm ET
    slots.push({ date: sunday, hours: 20, minutes: 20 });

    // Monday Night 8:15pm ET
    slots.push({ date: monday, hours: 20, minutes: 15 });

    // Assign slots to matchups
    for (let i = 0; i < matchups.length; i++) {
      const [homeIdx, awayIdx] = matchups[i];
      const slot = slots[i];
      games.push({
        homeTeam: ALL_TEAMS[homeIdx],
        awayTeam: ALL_TEAMS[awayIdx],
        week: weekNum,
        startTime: etToUtc(slot.date, slot.hours, slot.minutes),
      });
    }
  }

  return games;
}

async function main() {
  console.log('🏈 Seeding NFL 2026 Regular Season (272 games, 18 weeks)...');

  // Delete existing NFL match data (cascade: predictions and results first)
  await prisma.nflPrediction.deleteMany({});
  await prisma.nflResult.deleteMany({});
  await prisma.nflMatch.deleteMany({});

  const games = generateSchedule();

  console.log(`Generated ${games.length} games. Inserting...`);

  for (const game of games) {
    await prisma.nflMatch.create({
      data: {
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        week: game.week,
        startTime: game.startTime,
      },
    });
  }

  console.log(`✅ Seeded ${games.length} NFL matches across 18 weeks.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
