import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// Map old placeholder names to new real team names, matched by startTime
const updates = [
  { old: ["2º Grupo A", "2º Grupo B"], new: ["Sudáfrica", "Canadá"] },
  { old: ["1º Grupo E", "3º Grupo A/B/C/D/F"], new: ["Alemania", "Paraguay"] },
  { old: ["1º Grupo F", "2º Grupo C"], new: ["Brasil", "Japón"] },
  { old: ["1º Grupo C", "2º Grupo F"], new: ["Países Bajos", "Marruecos"] },
  { old: ["1º Grupo I", "3º Grupo C/D/F/G/H"], new: ["Francia", "Suecia"] },
  { old: ["2º Grupo E", "2º Grupo I"], new: ["Costa de Marfil", "Noruega"] },
  { old: ["1º Grupo A", "3º Grupo C/E/F/H/I"], new: ["México", "Ecuador"] },
  { old: ["1º Grupo L", "3º Grupo E/H/I/J/K"], new: ["Inglaterra", "RD Congo"] },
  { old: ["1º Grupo D", "3º Grupo B/E/F/I/J"], new: ["Estados Unidos", "Bosnia y Herzegovina"] },
  { old: ["1º Grupo G", "3º Grupo A/E/H/I/J"], new: ["Bélgica", "Senegal"] },
  { old: ["2º Grupo K", "2º Grupo L"], new: ["Portugal", "Croacia"] },
  { old: ["1º Grupo H", "2º Grupo J"], new: ["España", "Austria"] },
  { old: ["1º Grupo B", "3º Grupo E/F/G/I/J"], new: ["Suiza", "Argelia"] },
  { old: ["1º Grupo J", "2º Grupo H"], new: ["Argentina", "Cabo Verde"] },
  { old: ["1º Grupo K", "3º Grupo D/E/I/J/L"], new: ["Colombia", "Ghana"] },
  { old: ["2º Grupo D", "2º Grupo G"], new: ["Australia", "Egipto"] },
];

async function main() {
  console.log("🔄 Updating Round of 32 team names...");

  for (const u of updates) {
    const result = await prisma.match.updateMany({
      where: { homeTeam: u.old[0], awayTeam: u.old[1], phase: "R16" },
      data: { homeTeam: u.new[0], awayTeam: u.new[1] },
    });
    if (result.count > 0) {
      console.log(`  ✅ ${u.old[0]} vs ${u.old[1]} → ${u.new[0]} vs ${u.new[1]}`);
    } else {
      console.log(`  ⚠️  No encontrado: ${u.old[0]} vs ${u.old[1]}`);
    }
  }

  // Create bonus questions for all pools
  console.log("\n🎯 Creating bonus questions...");

  const pools = await prisma.pool.findMany();
  for (const pool of pools) {
    // Check if questions already exist to avoid duplicates
    const existing = await prisma.bonusQuestion.findMany({ where: { poolId: pool.id } });
    if (existing.length > 0) {
      console.log(`  ⏭️  Pool "${pool.name}" ya tiene preguntas bonus, saltando.`);
      continue;
    }

    await prisma.bonusQuestion.create({
      data: {
        poolId: pool.id,
        question: "¿Quién será el campeón de goleo de este mundial?",
        points: 10,
        opensAt: new Date("2026-06-29T06:00:01Z"),
        deadline: new Date("2026-06-30T05:59:59Z"),
        options: [
          "Lionel Messi",
          "Kylian Mbappé",
          "Erling Haaland",
          "Ousmane Dembélé",
          "Vinícius Júnior",
          "Deniz Undav",
          "Jonathan David",
          "Matheus Cunha",
          "Ismael Saibari",
          "Brian Brobbey",
        ],
      },
    });

    await prisma.bonusQuestion.create({
      data: {
        poolId: pool.id,
        question: "¿Quién ganará el mundial?",
        points: 10,
        opensAt: new Date("2026-06-29T06:00:01Z"),
        deadline: new Date("2026-06-30T05:59:59Z"),
        options: [
          "Sudáfrica",
          "Canadá",
          "Alemania",
          "Paraguay",
          "Brasil",
          "Japón",
          "Países Bajos",
          "Marruecos",
          "Francia",
          "Suecia",
          "Costa de Marfil",
          "Noruega",
          "México",
          "Ecuador",
          "Inglaterra",
          "RD Congo",
          "Estados Unidos",
          "Bosnia y Herzegovina",
          "Bélgica",
          "Senegal",
          "Portugal",
          "Croacia",
          "España",
          "Austria",
          "Suiza",
          "Argelia",
          "Argentina",
          "Cabo Verde",
          "Colombia",
          "Ghana",
          "Australia",
          "Egipto",
        ],
      },
    });

    console.log(`  ✅ Pool "${pool.name}": 2 preguntas bonus creadas.`);
  }

  console.log("\n✅ Done!");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
