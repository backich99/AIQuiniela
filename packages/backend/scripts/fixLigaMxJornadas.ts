import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const DB_URL = process.env.DATABASE_URL_POOLER || process.env.DATABASE_URL!;
const adapter = new PrismaPg(DB_URL);
const prisma = new PrismaClient({ adapter });

// Official Liga MX Apertura 2026 schedule - 17 jornadas, 9 matches each
// Format: [homeTeam, awayTeam] per jornada
const JORNADAS: [string, string][][] = [
  // Jornada 1 (Jul 16-18)
  [['Necaxa','Atlante'],['Tijuana','Tigres UANL'],['Atlético de San Luis','Cruz Azul'],['León','Atlas'],['FC Juarez','Puebla'],['Pumas UNAM','Pachuca'],['Monterrey','Santos'],['Guadalajara','Toluca'],['Querétaro','América']],
  // Jornada 2 (Jul 21-27)
  [['Cruz Azul','Puebla'],['Toluca','Pumas UNAM'],['Tijuana','León'],['Atlante','América'],['Guadalajara','FC Juarez'],['Tigres UANL','Atlético de San Luis'],['Santos','Atlas'],['Necaxa','Monterrey'],['Pachuca','Querétaro']],
  // Jornada 3 (Jul 31 - Aug 2)
  [['Puebla','Guadalajara'],['FC Juarez','Pumas UNAM'],['Atlético de San Luis','Tijuana'],['Querétaro','Tigres UANL'],['Atlas','Monterrey'],['León','Pachuca'],['Cruz Azul','Atlante'],['América','Santos'],['Toluca','Necaxa']],
  // Jornada 4 (Aug 15-17)
  [['Atlante','Toluca'],['Monterrey','FC Juarez'],['Atlas','Tigres UANL'],['Pumas UNAM','Querétaro'],['América','Atlético de San Luis'],['Santos','Guadalajara'],['Tijuana','Cruz Azul'],['Necaxa','León'],['Pachuca','Puebla']],
  // Jornada 5 (Aug 21-23)
  [['Tigres UANL','Atlante'],['FC Juarez','América'],['Querétaro','Toluca'],['Guadalajara','Tijuana'],['Puebla','Santos'],['León','Monterrey'],['Cruz Azul','Atlas'],['Atlético de San Luis','Pachuca'],['Pumas UNAM','Necaxa']],
  // Jornada 6 (Aug 28-30)
  [['Atlante','León'],['Necaxa','Cruz Azul'],['Tijuana','Pumas UNAM'],['Atlas','Querétaro'],['Pachuca','Guadalajara'],['América','Puebla'],['Santos','Tigres UANL'],['Toluca','FC Juarez'],['Monterrey','Atlético de San Luis']],
  // Jornada 7 (Sep 4-6)
  [['Puebla','Toluca'],['FC Juarez','Pachuca'],['Atlético de San Luis','Guadalajara'],['Querétaro','Monterrey'],['Tigres UANL','Necaxa'],['América','Tijuana'],['Atlas','Atlante'],['Pumas UNAM','León'],['Cruz Azul','Santos']],
  // Jornada 8 (Sep 11-13)
  [['Necaxa','Puebla'],['Atlante','Pachuca'],['Tijuana','Querétaro'],['Toluca','Atlas'],['Cruz Azul','América'],['León','Atlético de San Luis'],['Guadalajara','Pumas UNAM'],['Santos','FC Juarez'],['Monterrey','Tigres UANL']],
  // Jornada 9 (Sep 18-20)
  [['Puebla','Atlante'],['FC Juarez','Tigres UANL'],['Atlético de San Luis','Necaxa'],['Atlas','Pumas UNAM'],['Monterrey','Cruz Azul'],['América','Guadalajara'],['Toluca','Santos'],['Pachuca','Tijuana'],['Querétaro','León']],
  // Jornada 10 (Sep 25-27)
  [['Atlante','Monterrey'],['Tijuana','Atlas'],['Guadalajara','Querétaro'],['Santos','Pachuca'],['Tigres UANL','Puebla'],['Cruz Azul','Toluca'],['Pumas UNAM','Atlético de San Luis'],['León','FC Juarez'],['Necaxa','América']],
  // Jornada 11 (Oct 9-11)
  [['Puebla','León'],['Querétaro','Atlante'],['Tigres UANL','Toluca'],['FC Juarez','Tijuana'],['Atlas','Guadalajara'],['América','Monterrey'],['Pachuca','Necaxa'],['Atlético de San Luis','Santos'],['Pumas UNAM','Cruz Azul']],
  // Jornada 12 (Oct 16-18)
  [['Necaxa','Atlas'],['Tijuana','Puebla'],['Atlante','Pumas UNAM'],['Santos','Querétaro'],['Guadalajara','Tigres UANL'],['León','América'],['Toluca','Atlético de San Luis'],['Cruz Azul','FC Juarez'],['Monterrey','Pachuca']],
  // Jornada 13 (Oct 20-21)
  [['FC Juarez','Atlante'],['Atlético de San Luis','Querétaro'],['Tigres UANL','León'],['Guadalajara','Necaxa'],['Puebla','Monterrey'],['Atlas','América'],['Toluca','Tijuana'],['Pachuca','Cruz Azul'],['Santos','Pumas UNAM']],
  // Jornada 14 (Oct 23-25)
  [['Necaxa','FC Juarez'],['Atlante','Atlético de San Luis'],['León','Toluca'],['Monterrey','Guadalajara'],['Pumas UNAM','Tigres UANL'],['Atlas','Puebla'],['América','Pachuca'],['Querétaro','Cruz Azul'],['Tijuana','Santos']],
  // Jornada 15 (Oct 30 - Nov 1)
  [['FC Juarez','Querétaro'],['Atlético de San Luis','Atlas'],['Puebla','Pumas UNAM'],['Pachuca','Tigres UANL'],['Monterrey','Tijuana'],['Guadalajara','Atlante'],['América','Toluca'],['Santos','Necaxa'],['Cruz Azul','León']],
  // Jornada 16 (Nov 6-8)
  [['Necaxa','Tijuana'],['Atlético de San Luis','FC Juarez'],['Atlante','Santos'],['Atlas','Pachuca'],['Tigres UANL','Cruz Azul'],['Toluca','Monterrey'],['Pumas UNAM','América'],['Querétaro','Puebla'],['León','Guadalajara']],
  // Jornada 17 (Nov 20-22)
  [['Puebla','Atlético de San Luis'],['FC Juarez','Atlas'],['Tijuana','Atlante'],['Pachuca','Toluca'],['Santos','León'],['Pumas UNAM','Monterrey'],['Tigres UANL','América'],['Guadalajara','Cruz Azul'],['Querétaro','Necaxa']],
];

async function main() {
  console.log('🔧 Fixing Liga MX jornadas...');

  const allMatches = await prisma.nflMatch.findMany({
    where: { league: 'LIGA_MX' },
    select: { id: true, homeTeam: true, awayTeam: true, week: true },
  });

  console.log(`Found ${allMatches.length} Liga MX matches in DB.`);

  let updated = 0;
  let notFound = 0;

  for (let j = 0; j < JORNADAS.length; j++) {
    const jornada = j + 1;
    for (const [home, away] of JORNADAS[j]) {
      const match = allMatches.find(m => m.homeTeam === home && m.awayTeam === away);
      if (match) {
        if (match.week !== jornada) {
          await prisma.nflMatch.update({
            where: { id: match.id },
            data: { week: jornada },
          });
          updated++;
        }
      } else {
        console.log(`  NOT FOUND: ${home} vs ${away} (Jornada ${jornada})`);
        notFound++;
      }
    }
  }

  console.log(`\n✅ Updated ${updated} matches. Not found: ${notFound}.`);
  console.log(`Total expected: ${JORNADAS.length * 9} = ${JORNADAS.reduce((s, j) => s + j.length, 0)}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
