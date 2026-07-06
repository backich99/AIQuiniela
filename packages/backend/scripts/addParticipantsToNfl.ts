import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Check if NFL pool already exists
  let nflPool = await prisma.nflPool.findFirst();

  if (!nflPool) {
    const admin = await prisma.user.findFirst({ where: { email: 'backich99@gmail.com' } });
    if (!admin) { console.log('Admin not found'); return; }

    nflPool = await prisma.nflPool.create({
      data: {
        name: 'La Garnacha NFL 2026',
        invitationCode: 'NFL2026G',
        adminId: admin.id,
        season: 2026,
      },
    });
    console.log('Created NFL pool:', nflPool.name);
  } else {
    console.log('NFL pool exists:', nflPool.name);
  }

  // Get World Cup participants
  const wcPool = await prisma.pool.findFirst({ where: { name: { contains: 'Garnacha' } } });
  if (!wcPool) { console.log('WC pool not found'); return; }

  const wcParticipants = await prisma.participant.findMany({
    where: { poolId: wcPool.id },
    include: { user: true },
  });

  console.log('WC participants:', wcParticipants.length);

  for (const p of wcParticipants) {
    const existing = await prisma.nflParticipant.findUnique({
      where: { userId_poolId: { userId: p.userId, poolId: nflPool.id } },
    });

    if (!existing) {
      await prisma.nflParticipant.create({
        data: { userId: p.userId, poolId: nflPool.id, displayName: p.displayName },
      });
      console.log('  ✓ Added:', p.displayName);
    } else {
      console.log('  - Already in:', p.displayName);
    }
  }

  console.log('Done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
