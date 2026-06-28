import 'dotenv/config';
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { MatchPhase } from "@prisma/client";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

// All times are ET (UTC-4 in summer). We convert to UTC by adding 4 hours.
function et(date: string, time: string): Date {
  const [hours, minutes] = time.split(':').map(Number);
  // Create a date in ET, then add 4 hours for UTC
  const d = new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  d.setUTCHours(d.getUTCHours() + 4);
  return d;
}

async function main() {
  console.log("🌱 Seeding World Cup 2026 complete schedule (104 matches)...");

  // Delete existing data
  await prisma.prediction.deleteMany({});
  await prisma.matchResult.deleteMany({});
  await prisma.match.deleteMany({});

  const matches = [
    // ===== JORNADA 1 =====
    // June 11
    { homeTeam: "México", awayTeam: "Sudáfrica", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-11", "15:00") },
    { homeTeam: "República de Corea", awayTeam: "República Checa", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-11", "22:00") },
    // June 12
    { homeTeam: "Canadá", awayTeam: "Bosnia y Herzegovina", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-12", "15:00") },
    { homeTeam: "Estados Unidos", awayTeam: "Paraguay", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-12", "21:00") },
    // June 13
    { homeTeam: "Catar", awayTeam: "Suiza", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-13", "15:00") },
    { homeTeam: "Brasil", awayTeam: "Marruecos", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-13", "18:00") },
    { homeTeam: "Haití", awayTeam: "Escocia", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-13", "21:00") },
    { homeTeam: "Australia", awayTeam: "Turquía", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-14", "00:00") },
    // June 14
    { homeTeam: "Alemania", awayTeam: "Curazao", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-14", "13:00") },
    { homeTeam: "Países Bajos", awayTeam: "Japón", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-14", "16:00") },
    { homeTeam: "Costa de Marfil", awayTeam: "Ecuador", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-14", "19:00") },
    { homeTeam: "Suecia", awayTeam: "Túnez", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-14", "22:00") },
    // June 15
    { homeTeam: "España", awayTeam: "Cabo Verde", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-15", "12:00") },
    { homeTeam: "Bélgica", awayTeam: "Egipto", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-15", "15:00") },
    { homeTeam: "Arabia Saudí", awayTeam: "Uruguay", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-15", "18:00") },
    { homeTeam: "Irán", awayTeam: "Nueva Zelanda", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-15", "21:00") },
    // June 16
    { homeTeam: "Francia", awayTeam: "Senegal", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-16", "15:00") },
    { homeTeam: "Irak", awayTeam: "Noruega", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-16", "18:00") },
    { homeTeam: "Argentina", awayTeam: "Argelia", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-16", "21:00") },
    { homeTeam: "Austria", awayTeam: "Jordania", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-17", "00:00") },
    // June 17
    { homeTeam: "Portugal", awayTeam: "RD Congo", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-17", "13:00") },
    { homeTeam: "Inglaterra", awayTeam: "Croacia", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-17", "16:00") },
    { homeTeam: "Ghana", awayTeam: "Panamá", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-17", "19:00") },
    { homeTeam: "Uzbekistán", awayTeam: "Colombia", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-17", "22:00") },

    // ===== JORNADA 2 =====
    // June 18
    { homeTeam: "República Checa", awayTeam: "Sudáfrica", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-18", "12:00") },
    { homeTeam: "Suiza", awayTeam: "Bosnia y Herzegovina", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-18", "15:00") },
    { homeTeam: "Canadá", awayTeam: "Catar", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-18", "18:00") },
    { homeTeam: "México", awayTeam: "República de Corea", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-18", "21:00") },
    // June 19
    { homeTeam: "Estados Unidos", awayTeam: "Australia", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-19", "15:00") },
    { homeTeam: "Escocia", awayTeam: "Marruecos", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-19", "18:00") },
    { homeTeam: "Brasil", awayTeam: "Haití", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-19", "21:00") },
    { homeTeam: "Turquía", awayTeam: "Paraguay", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-20", "00:00") },
    // June 20
    { homeTeam: "Países Bajos", awayTeam: "Suecia", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-20", "13:00") },
    { homeTeam: "Alemania", awayTeam: "Costa de Marfil", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-20", "16:00") },
    { homeTeam: "Ecuador", awayTeam: "Curazao", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-20", "22:00") },
    { homeTeam: "Túnez", awayTeam: "Japón", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-21", "00:00") },
    // June 21
    { homeTeam: "España", awayTeam: "Arabia Saudí", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-21", "12:00") },
    { homeTeam: "Bélgica", awayTeam: "Irán", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-21", "15:00") },
    { homeTeam: "Uruguay", awayTeam: "Cabo Verde", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-21", "18:00") },
    { homeTeam: "Nueva Zelanda", awayTeam: "Egipto", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-21", "21:00") },
    // June 22
    { homeTeam: "Argentina", awayTeam: "Austria", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-22", "13:00") },
    { homeTeam: "Francia", awayTeam: "Irak", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-22", "17:00") },
    { homeTeam: "Noruega", awayTeam: "Senegal", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-22", "20:00") },
    { homeTeam: "Jordania", awayTeam: "Argelia", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-22", "23:00") },
    // June 23
    { homeTeam: "Portugal", awayTeam: "Uzbekistán", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-23", "13:00") },
    { homeTeam: "Inglaterra", awayTeam: "Ghana", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-23", "16:00") },
    { homeTeam: "Panamá", awayTeam: "Croacia", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-23", "19:00") },
    { homeTeam: "Colombia", awayTeam: "RD Congo", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-23", "22:00") },

    // ===== JORNADA 3 (simultáneos por grupo) =====
    // June 24
    { homeTeam: "Suiza", awayTeam: "Canadá", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "15:00") },
    { homeTeam: "Bosnia y Herzegovina", awayTeam: "Catar", group: "B", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "15:00") },
    { homeTeam: "Escocia", awayTeam: "Brasil", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "18:00") },
    { homeTeam: "Marruecos", awayTeam: "Haití", group: "C", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "18:00") },
    { homeTeam: "República Checa", awayTeam: "México", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "21:00") },
    { homeTeam: "Sudáfrica", awayTeam: "República de Corea", group: "A", phase: MatchPhase.GROUPS, startTime: et("2026-06-24", "21:00") },
    // June 25
    { homeTeam: "Curazao", awayTeam: "Costa de Marfil", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "16:00") },
    { homeTeam: "Ecuador", awayTeam: "Alemania", group: "E", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "16:00") },
    { homeTeam: "Japón", awayTeam: "Suecia", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "19:00") },
    { homeTeam: "Túnez", awayTeam: "Países Bajos", group: "F", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "19:00") },
    { homeTeam: "Turquía", awayTeam: "Estados Unidos", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "22:00") },
    { homeTeam: "Paraguay", awayTeam: "Australia", group: "D", phase: MatchPhase.GROUPS, startTime: et("2026-06-25", "22:00") },
    // June 26
    { homeTeam: "Noruega", awayTeam: "Francia", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "15:00") },
    { homeTeam: "Senegal", awayTeam: "Irak", group: "I", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "15:00") },
    { homeTeam: "Cabo Verde", awayTeam: "Arabia Saudí", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "20:00") },
    { homeTeam: "Uruguay", awayTeam: "España", group: "H", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "20:00") },
    { homeTeam: "Egipto", awayTeam: "Irán", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "23:00") },
    { homeTeam: "Nueva Zelanda", awayTeam: "Bélgica", group: "G", phase: MatchPhase.GROUPS, startTime: et("2026-06-26", "23:00") },
    // June 27
    { homeTeam: "Panamá", awayTeam: "Inglaterra", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "17:00") },
    { homeTeam: "Croacia", awayTeam: "Ghana", group: "L", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "17:00") },
    { homeTeam: "Colombia", awayTeam: "Portugal", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "19:30") },
    { homeTeam: "RD Congo", awayTeam: "Uzbekistán", group: "K", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "19:30") },
    { homeTeam: "Argelia", awayTeam: "Austria", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "22:00") },
    { homeTeam: "Jordania", awayTeam: "Argentina", group: "J", phase: MatchPhase.GROUPS, startTime: et("2026-06-27", "22:00") },

    // ===== TREINTAIDOSAVOS DE FINAL (Round of 32) =====
    { homeTeam: "Sudáfrica", awayTeam: "Canadá", group: null, phase: MatchPhase.R16, startTime: et("2026-06-28", "15:00") },
    { homeTeam: "Alemania", awayTeam: "Paraguay", group: null, phase: MatchPhase.R16, startTime: et("2026-06-29", "13:00") },
    { homeTeam: "Brasil", awayTeam: "Japón", group: null, phase: MatchPhase.R16, startTime: et("2026-06-29", "17:00") },
    { homeTeam: "Países Bajos", awayTeam: "Marruecos", group: null, phase: MatchPhase.R16, startTime: et("2026-06-29", "21:00") },
    { homeTeam: "Francia", awayTeam: "Suecia", group: null, phase: MatchPhase.R16, startTime: et("2026-06-30", "13:00") },
    { homeTeam: "Costa de Marfil", awayTeam: "Noruega", group: null, phase: MatchPhase.R16, startTime: et("2026-06-30", "17:00") },
    { homeTeam: "México", awayTeam: "Ecuador", group: null, phase: MatchPhase.R16, startTime: et("2026-06-30", "21:00") },
    { homeTeam: "Inglaterra", awayTeam: "RD Congo", group: null, phase: MatchPhase.R16, startTime: et("2026-07-01", "12:00") },
    { homeTeam: "Estados Unidos", awayTeam: "Bosnia y Herzegovina", group: null, phase: MatchPhase.R16, startTime: et("2026-07-01", "16:00") },
    { homeTeam: "Bélgica", awayTeam: "Senegal", group: null, phase: MatchPhase.R16, startTime: et("2026-07-01", "20:00") },
    { homeTeam: "Portugal", awayTeam: "Croacia", group: null, phase: MatchPhase.R16, startTime: et("2026-07-02", "13:00") },
    { homeTeam: "España", awayTeam: "Austria", group: null, phase: MatchPhase.R16, startTime: et("2026-07-02", "17:00") },
    { homeTeam: "Suiza", awayTeam: "Argelia", group: null, phase: MatchPhase.R16, startTime: et("2026-07-02", "21:00") },
    { homeTeam: "Argentina", awayTeam: "Cabo Verde", group: null, phase: MatchPhase.R16, startTime: et("2026-07-03", "13:00") },
    { homeTeam: "Colombia", awayTeam: "Ghana", group: null, phase: MatchPhase.R16, startTime: et("2026-07-03", "17:00") },
    { homeTeam: "Australia", awayTeam: "Egipto", group: null, phase: MatchPhase.R16, startTime: et("2026-07-03", "21:00") },

    // ===== OCTAVOS DE FINAL (Round of 16) =====
    { homeTeam: "Ganador P74", awayTeam: "Ganador P77", group: null, phase: MatchPhase.QF, startTime: et("2026-07-04", "13:00") },
    { homeTeam: "Ganador P73", awayTeam: "Ganador P75", group: null, phase: MatchPhase.QF, startTime: et("2026-07-04", "17:00") },
    { homeTeam: "Ganador P76", awayTeam: "Ganador P78", group: null, phase: MatchPhase.QF, startTime: et("2026-07-05", "16:00") },
    { homeTeam: "Ganador P79", awayTeam: "Ganador P80", group: null, phase: MatchPhase.QF, startTime: et("2026-07-05", "20:00") },
    { homeTeam: "Ganador P83", awayTeam: "Ganador P84", group: null, phase: MatchPhase.QF, startTime: et("2026-07-06", "15:00") },
    { homeTeam: "Ganador P81", awayTeam: "Ganador P82", group: null, phase: MatchPhase.QF, startTime: et("2026-07-06", "20:00") },
    { homeTeam: "Ganador P86", awayTeam: "Ganador P88", group: null, phase: MatchPhase.QF, startTime: et("2026-07-07", "12:00") },
    { homeTeam: "Ganador P85", awayTeam: "Ganador P87", group: null, phase: MatchPhase.QF, startTime: et("2026-07-07", "16:00") },

    // ===== CUARTOS DE FINAL =====
    { homeTeam: "Ganador P89", awayTeam: "Ganador P90", group: null, phase: MatchPhase.QF, startTime: et("2026-07-09", "16:00") },
    { homeTeam: "Ganador P93", awayTeam: "Ganador P94", group: null, phase: MatchPhase.QF, startTime: et("2026-07-10", "15:00") },
    { homeTeam: "Ganador P91", awayTeam: "Ganador P92", group: null, phase: MatchPhase.QF, startTime: et("2026-07-11", "17:00") },
    { homeTeam: "Ganador P95", awayTeam: "Ganador P96", group: null, phase: MatchPhase.QF, startTime: et("2026-07-11", "21:00") },

    // ===== SEMIFINALES =====
    { homeTeam: "Ganador P97", awayTeam: "Ganador P98", group: null, phase: MatchPhase.SF, startTime: et("2026-07-14", "15:00") },
    { homeTeam: "Ganador P99", awayTeam: "Ganador P100", group: null, phase: MatchPhase.SF, startTime: et("2026-07-15", "15:00") },

    // ===== TERCER LUGAR =====
    { homeTeam: "Perdedor SF1", awayTeam: "Perdedor SF2", group: null, phase: MatchPhase.FINAL, startTime: et("2026-07-18", "15:00") },

    // ===== FINAL =====
    { homeTeam: "Ganador SF1", awayTeam: "Ganador SF2", group: null, phase: MatchPhase.FINAL, startTime: et("2026-07-19", "15:00") },
  ];

  for (const match of matches) {
    await prisma.match.create({ data: match });
  }

  // Seed bonus question: Top Scorer (Golden Boot)
  // This question is only open on Sunday June 28, 2026 (CST = UTC-6)
  // Opens at 00:00:01 CST = 06:00:01 UTC, Closes at 23:59:59 CST = 05:59:59 UTC next day
  await prisma.bonusQuestion.deleteMany({});

  // We need at least one pool to attach the question to — skip if no pools exist
  const pools = await prisma.pool.findMany();
  for (const pool of pools) {
    await prisma.bonusQuestion.create({
      data: {
        poolId: pool.id,
        question: "¿Quién será el campeón de goleo de este mundial?",
        points: 10,
        opensAt: new Date("2026-06-29T06:00:01Z"), // Sunday 00:00:01 CST
        deadline: new Date("2026-06-30T05:59:59Z"), // Sunday 23:59:59 CST
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
        opensAt: new Date("2026-06-29T06:00:01Z"), // Sunday 00:00:01 CST
        deadline: new Date("2026-06-30T05:59:59Z"), // Sunday 23:59:59 CST
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
  }

  console.log(`✅ Seeded ${matches.length} matches and bonus questions.`);
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
