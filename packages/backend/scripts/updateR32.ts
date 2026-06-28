import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

// Confirmed Round of 32 matchups (from Fox Sports, June 27)
// Ordered by date as they appear in the DB
const r32Matchups = [
  // June 28 - Match 73
  { home: 'Canadá', away: 'Sudáfrica' },
  // June 29 - Matches 74, 75, 76
  { home: 'Alemania', away: 'Paraguay' },
  { home: 'Países Bajos', away: 'Marruecos' },
  { home: 'Brasil', away: 'Japón' },
  // June 30 - Matches 77, 78, 79
  { home: 'Francia', away: 'Suecia' },
  { home: 'Costa de Marfil', away: 'Noruega' },
  { home: 'México', away: 'Ecuador' },
  // July 1 - Matches 80, 81, 82
  { home: 'Inglaterra', away: 'RD Congo' },
  { home: 'Estados Unidos', away: 'Bosnia y Herzegovina' },
  { home: 'Bélgica', away: 'Senegal' },
  // July 2 - Matches 83, 84, 85
  { home: 'Portugal', away: 'Croacia' },
  { home: 'España', away: 'Austria' },
  { home: 'Suiza', away: 'Irán' },
  // July 3 - Matches 86, 87, 88
  { home: 'Argentina', away: 'Cabo Verde' },
  { home: 'Colombia', away: 'Ghana' },
  { home: 'Egipto', away: 'Australia' },
];

async function main() {
  // Get all R16 matches ordered by startTime
  const matches = await prisma.match.findMany({
    where: { phase: 'R16' },
    orderBy: { startTime: 'asc' },
  });

  console.log(`Found ${matches.length} R16 matches in DB.`);

  if (matches.length !== r32Matchups.length) {
    console.error(`Expected ${r32Matchups.length} but found ${matches.length}`);
    return;
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const update = r32Matchups[i];

    await prisma.match.update({
      where: { id: match.id },
      data: { homeTeam: update.home, awayTeam: update.away },
    });
    console.log(`✓ ${update.home} vs ${update.away}`);
  }

  console.log(`\n✅ Updated all ${matches.length} Round of 32 matches.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
