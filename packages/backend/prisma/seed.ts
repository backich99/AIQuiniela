import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MatchPhase } from "@prisma/client";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding World Cup 2026 full group stage...");

  // Delete existing matches to re-seed
  await prisma.prediction.deleteMany({});
  await prisma.matchResult.deleteMany({});
  await prisma.match.deleteMany({});

  // All times in ET converted to UTC (ET = UTC-4 in summer)
  // Format: ET time + 4 hours = UTC
  const matches = [
    // === June 11 ===
    { homeTeam: "México", awayTeam: "Sudáfrica", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-11T19:00:00Z") },
    { homeTeam: "Corea del Sur", awayTeam: "Chequia", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-12T02:00:00Z") },

    // === June 12 ===
    { homeTeam: "Canadá", awayTeam: "Bosnia y Herzegovina", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-12T19:00:00Z") },
    { homeTeam: "Estados Unidos", awayTeam: "Paraguay", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-13T01:00:00Z") },

    // === June 13 ===
    { homeTeam: "Qatar", awayTeam: "Suiza", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-13T19:00:00Z") },
    { homeTeam: "Brasil", awayTeam: "Marruecos", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-13T22:00:00Z") },
    { homeTeam: "Haití", awayTeam: "Escocia", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-14T01:00:00Z") },
    { homeTeam: "Australia", awayTeam: "Turquía", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-14T04:00:00Z") },

    // === June 14 ===
    { homeTeam: "Alemania", awayTeam: "Curazao", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-14T17:00:00Z") },
    { homeTeam: "Países Bajos", awayTeam: "Japón", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-14T20:00:00Z") },
    { homeTeam: "Costa de Marfil", awayTeam: "Ecuador", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-14T23:00:00Z") },
    { homeTeam: "Túnez", awayTeam: "Suecia", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-15T02:00:00Z") },

    // === June 15 ===
    { homeTeam: "España", awayTeam: "Cabo Verde", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-15T16:00:00Z") },
    { homeTeam: "Bélgica", awayTeam: "Egipto", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-15T19:00:00Z") },
    { homeTeam: "Arabia Saudita", awayTeam: "Uruguay", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-15T22:00:00Z") },
    { homeTeam: "Irán", awayTeam: "Nueva Zelanda", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-16T01:00:00Z") },

    // === June 16 ===
    { homeTeam: "Francia", awayTeam: "Senegal", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-16T19:00:00Z") },
    { homeTeam: "Irak", awayTeam: "Noruega", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-16T22:00:00Z") },
    { homeTeam: "Argentina", awayTeam: "Argelia", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-17T01:00:00Z") },
    { homeTeam: "Austria", awayTeam: "Jordania", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-17T04:00:00Z") },

    // === June 17 ===
    { homeTeam: "Portugal", awayTeam: "RD Congo", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-17T17:00:00Z") },
    { homeTeam: "Inglaterra", awayTeam: "Croacia", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-17T20:00:00Z") },
    { homeTeam: "Ghana", awayTeam: "Panamá", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-17T23:00:00Z") },
    { homeTeam: "Uzbekistán", awayTeam: "Colombia", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-18T02:00:00Z") },

    // === June 18 (Jornada 2) ===
    { homeTeam: "Chequia", awayTeam: "Sudáfrica", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-18T16:00:00Z") },
    { homeTeam: "Suiza", awayTeam: "Bosnia y Herzegovina", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-18T19:00:00Z") },
    { homeTeam: "Canadá", awayTeam: "Qatar", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-18T22:00:00Z") },
    { homeTeam: "México", awayTeam: "Corea del Sur", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-19T01:00:00Z") },

    // === June 19 ===
    { homeTeam: "Estados Unidos", awayTeam: "Australia", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-19T19:00:00Z") },
    { homeTeam: "Escocia", awayTeam: "Marruecos", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-19T19:00:00Z") },
    { homeTeam: "Brasil", awayTeam: "Haití", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-20T01:00:00Z") },
    { homeTeam: "Turquía", awayTeam: "Paraguay", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-20T04:00:00Z") },

    // === June 20 ===
    { homeTeam: "Países Bajos", awayTeam: "Suecia", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-20T17:00:00Z") },
    { homeTeam: "Alemania", awayTeam: "Costa de Marfil", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-20T20:00:00Z") },
    { homeTeam: "Ecuador", awayTeam: "Curazao", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-21T00:00:00Z") },
    { homeTeam: "Túnez", awayTeam: "Japón", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-21T04:00:00Z") },

    // === June 21 ===
    { homeTeam: "España", awayTeam: "Arabia Saudita", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-21T16:00:00Z") },
    { homeTeam: "Bélgica", awayTeam: "Irán", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-21T19:00:00Z") },
    { homeTeam: "Uruguay", awayTeam: "Cabo Verde", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-21T22:00:00Z") },
    { homeTeam: "Nueva Zelanda", awayTeam: "Egipto", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-22T01:00:00Z") },

    // === June 22 ===
    { homeTeam: "Argentina", awayTeam: "Austria", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-22T17:00:00Z") },
    { homeTeam: "Francia", awayTeam: "Irak", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-22T21:00:00Z") },
    { homeTeam: "Noruega", awayTeam: "Senegal", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-23T00:00:00Z") },
    { homeTeam: "Jordania", awayTeam: "Argelia", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-23T03:00:00Z") },

    // === June 23 ===
    { homeTeam: "Portugal", awayTeam: "Uzbekistán", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-23T17:00:00Z") },
    { homeTeam: "Inglaterra", awayTeam: "Ghana", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-23T20:00:00Z") },
    { homeTeam: "Panamá", awayTeam: "Croacia", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-23T23:00:00Z") },
    { homeTeam: "Colombia", awayTeam: "RD Congo", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-24T02:00:00Z") },

    // === June 24 (Jornada 3 - simultáneos por grupo) ===
    { homeTeam: "Suiza", awayTeam: "Canadá", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-24T19:00:00Z") },
    { homeTeam: "Bosnia y Herzegovina", awayTeam: "Qatar", group: "B", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-24T19:00:00Z") },
    { homeTeam: "Brasil", awayTeam: "Escocia", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-24T22:00:00Z") },
    { homeTeam: "Marruecos", awayTeam: "Haití", group: "C", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-24T22:00:00Z") },
    { homeTeam: "México", awayTeam: "Chequia", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T01:00:00Z") },
    { homeTeam: "Corea del Sur", awayTeam: "Sudáfrica", group: "A", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T01:00:00Z") },

    // === June 25 ===
    { homeTeam: "Ecuador", awayTeam: "Alemania", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T20:00:00Z") },
    { homeTeam: "Curazao", awayTeam: "Costa de Marfil", group: "E", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T20:00:00Z") },
    { homeTeam: "Túnez", awayTeam: "Países Bajos", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T23:00:00Z") },
    { homeTeam: "Japón", awayTeam: "Suecia", group: "F", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-25T23:00:00Z") },
    { homeTeam: "Estados Unidos", awayTeam: "Turquía", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-26T02:00:00Z") },
    { homeTeam: "Paraguay", awayTeam: "Australia", group: "D", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-26T02:00:00Z") },

    // === June 26 ===
    { homeTeam: "Noruega", awayTeam: "Francia", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-26T19:00:00Z") },
    { homeTeam: "Senegal", awayTeam: "Irak", group: "I", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-26T19:00:00Z") },
    { homeTeam: "Uruguay", awayTeam: "España", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T00:00:00Z") },
    { homeTeam: "Cabo Verde", awayTeam: "Arabia Saudita", group: "H", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T00:00:00Z") },
    { homeTeam: "Nueva Zelanda", awayTeam: "Bélgica", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T03:00:00Z") },
    { homeTeam: "Egipto", awayTeam: "Irán", group: "G", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T03:00:00Z") },

    // === June 27 ===
    { homeTeam: "Panamá", awayTeam: "Inglaterra", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T21:00:00Z") },
    { homeTeam: "Croacia", awayTeam: "Ghana", group: "L", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T21:00:00Z") },
    { homeTeam: "Colombia", awayTeam: "Portugal", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T23:30:00Z") },
    { homeTeam: "RD Congo", awayTeam: "Uzbekistán", group: "K", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-27T23:30:00Z") },
    { homeTeam: "Argentina", awayTeam: "Jordania", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-28T02:00:00Z") },
    { homeTeam: "Argelia", awayTeam: "Austria", group: "J", phase: MatchPhase.GROUPS, startTime: new Date("2026-06-28T02:00:00Z") },
  ];

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  console.log(`✅ Seeded ${matches.length} group stage matches successfully.`);
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
