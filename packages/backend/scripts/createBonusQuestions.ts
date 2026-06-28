import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  const pool = await prisma.pool.findFirst({ where: { name: { contains: 'Garnacha' } } });
  if (!pool) { console.log('Pool not found'); return; }
  console.log('Pool:', pool.id, pool.name);

  // Sunday June 29 CST: opens 00:00:01 CST = 06:00:01 UTC, closes 23:59:59 CST = June 30 05:59:59 UTC
  const opensAt = new Date('2026-06-29T06:00:01Z');
  const deadline = new Date('2026-06-30T05:59:59Z');

  // Top 10 scorers
  const goalscorers = [
    'Lionel Messi',
    'Kylian Mbappé',
    'Vinícius Jr',
    'Erling Haaland',
    'Ousmane Dembélé',
    'Harry Kane',
    'Cristiano Ronaldo',
    'Ismaïl Saibari',
    'Cole Palmer',
    'Christian Pulisic',
  ];

  // 16 teams in round of 32
  const teams = [
    'Canadá', 'Alemania', 'Países Bajos', 'Brasil',
    'Francia', 'Costa de Marfil', 'México', 'Inglaterra',
    'Estados Unidos', 'Bélgica', 'Portugal', 'España',
    'Suiza', 'Argentina', 'Colombia', 'Egipto',
  ];

  const q1 = await prisma.bonusQuestion.create({
    data: {
      poolId: pool.id,
      question: '¿Quién será el campeón de goleo de este mundial?',
      points: 10,
      opensAt,
      deadline,
      options: goalscorers,
    },
  });
  console.log('✓ Created goleador question:', q1.id);

  const q2 = await prisma.bonusQuestion.create({
    data: {
      poolId: pool.id,
      question: '¿Quién ganará el mundial?',
      points: 10,
      opensAt,
      deadline,
      options: teams,
    },
  });
  console.log('✓ Created winner question:', q2.id);

  console.log('\n✅ Both questions created. Open Sunday June 29 (00:00-23:59 CST).');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
