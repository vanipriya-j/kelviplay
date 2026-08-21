import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS } from "../lib/game/achievements";
import { resolveDirectUrl } from "../lib/db-url";
import { DEFAULT_SCORING } from "../lib/game/scoring";
import { getWeekStart, zonedParts } from "../lib/game/time";

const CATEGORIES = [
  ["carnatic-music", "Carnatic Music"],
  ["indian-classical-arts", "Indian Classical Arts"],
  ["chennai", "Chennai"],
  ["tamil", "Tamil"],
  ["food", "Food"],
  ["festivals", "Festivals"],
  ["traditions", "Traditions"],
  ["temples", "Temples"],
  ["literature", "Literature"],
  ["cinema", "Cinema"],
  ["history", "History"],
  ["places", "Places"],
  ["objects", "Objects"],
  ["people", "People"],
] as const;

const GAMES = [
  ["kelvi", "Kelvi"],
  ["kolam-kraze", "Kolam Kraze"],
  ["sabha-canteen", "Sabha Canteen"],
  ["pallanguzhi", "Pallanguzhi"],
  ["aadu-puli-aattam", "Aadu Puli Aattam"],
] as const;

const VENUES = [
  ["music-academy", "The Music Academy", "Chennai", "sabha"],
  ["narada-gana-sabha", "Narada Gana Sabha", "Chennai", "sabha"],
  ["kalakshetra", "Kalakshetra", "Chennai", "school"],
  ["filter-coffee-house", "A Filter Coffee House", "Chennai", "cafe"],
];

const PLAYERS = [
  ["Meera", "meera@aarla.play", "Chennai"],
  ["Karthik", "karthik@aarla.play", "Chennai"],
  ["Arjun", "arjun@aarla.play", "Bengaluru"],
  ["Kavya", "kavya@aarla.play", "Chennai"],
  ["Ananya", "ananya@aarla.play", "Chennai"],
  ["Vani", "vani@aarla.play", "Chennai"],
  ["Nila", "nila@aarla.play", "Madurai"],
  ["Suresh", "suresh@aarla.play", "Chennai"],
  ["Priya", "priya@aarla.play", "Coimbatore"],
  ["Raman", "raman@aarla.play", "Chennai"],
  ["Divya", "divya@aarla.play", "Chennai"],
  ["Hari", "hari@aarla.play", "Hyderabad"],
  ["Lakshmi", "lakshmi@aarla.play", "Chennai"],
  ["Vikram", "vikram@aarla.play", "Chennai"],
  ["Sandhya", "sandhya@aarla.play", "Chennai"],
  ["Naveen", "naveen@aarla.play", "Bengaluru"],
  ["Aishwarya", "aishwarya@aarla.play", "Chennai"],
  ["Gautham", "gautham@aarla.play", "Chennai"],
  ["Janani", "janani@aarla.play", "Chennai"],
  ["Sriram", "sriram@aarla.play", "Chennai"],
  ["Keerthana", "keerthana@aarla.play", "Trichy"],
  ["Aditya", "aditya@aarla.play", "Chennai"],
  ["Bhavana", "bhavana@aarla.play", "Chennai"],
  ["Manoj", "manoj@aarla.play", "Chennai"],
  ["Revathi", "revathi@aarla.play", "Chennai"],
  ["Pranav", "pranav@aarla.play", "Chennai"],
  ["Ishwarya", "ishwarya@aarla.play", "Chennai"],
  ["Karthika", "karthika@aarla.play", "Chennai"],
  ["Siddharth", "siddharth@aarla.play", "Chennai"],
  ["Nandhini", "nandhini@aarla.play", "Chennai"],
  ["Vivek", "vivek@aarla.play", "Chennai"],
  ["Shreya", "shreya@aarla.play", "Chennai"],
  ["Arun", "arun@aarla.play", "Chennai"],
  ["Deepika", "deepika@aarla.play", "Chennai"],
  ["Varun", "varun@aarla.play", "Bengaluru"],
  ["Malini", "malini@aarla.play", "Chennai"],
] as const;

type QuestionSeed = {
  number: number;
  title: string;
  text: string;
  type: "MULTIPLE_CHOICE" | "TEXT";
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  answer: string;
  variants?: string[];
  options?: string[];
  offsetHours: number;
  durationHours: number;
};

const QUESTIONS: QuestionSeed[] = [
  {
    number: 170,
    title: "Kelvi",
    text: "In Tamil, what does கேள்வி / “Kelvi” most closely mean?",
    type: "MULTIPLE_CHOICE",
    category: "tamil",
    difficulty: "EASY",
    answer: "A question",
    options: ["A question", "A riddle prize", "A temple bell", "A harvest song"],
    offsetHours: -54,
    durationHours: 2,
  },
  {
    number: 171,
    title: "Davara",
    text: "Chennai filter coffee is traditionally poured between a tumbler and a…",
    type: "TEXT",
    category: "food",
    difficulty: "EASY",
    answer: "Davara",
    variants: ["davarum", "davara tumbler", "saucer", "coffee davara"],
    offsetHours: -52,
    durationHours: 2,
  },
  {
    number: 172,
    title: "Kutcheri",
    text: "In Carnatic culture, a kutcheri is…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "EASY",
    answer: "A concert",
    options: ["A concert", "A raga grammar book", "A temple kitchen", "A percussion cipher"],
    offsetHours: -48,
    durationHours: 2,
  },
  {
    number: 173,
    title: "Kalakshetra",
    text: "Kalakshetra is in which Chennai neighbourhood?",
    type: "TEXT",
    category: "chennai",
    difficulty: "MEDIUM",
    answer: "Thiruvanmiyur",
    variants: ["tiruvanmiyur", "thiruvanmiyur"],
    offsetHours: -46,
    durationHours: 2,
  },
  {
    number: 174,
    title: "Mudra",
    text: "Which composer’s compositions are signed with the mudra “Guruguha”?",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Muthuswami Dikshitar",
    options: [
      "Muthuswami Dikshitar",
      "Tyagaraja",
      "Syama Sastri",
      "Swathi Thirunal",
    ],
    offsetHours: -44,
    durationHours: 2,
  },
  {
    number: 175,
    title: "Pongal",
    text: "Pongal is primarily a festival of…",
    type: "MULTIPLE_CHOICE",
    category: "festivals",
    difficulty: "EASY",
    answer: "Harvest",
    options: ["Harvest", "Monsoon", "Ancestral new moon", "Temple consecration"],
    offsetHours: -42,
    durationHours: 2,
  },
  {
    number: 176,
    title: "Kapaleeswarar",
    text: "Kapaleeswarar Temple stands in which Chennai quarter?",
    type: "TEXT",
    category: "temples",
    difficulty: "EASY",
    answer: "Mylapore",
    variants: ["mayilapur", "mailapur", "mylapore"],
    offsetHours: -38,
    durationHours: 2,
  },
  {
    number: 177,
    title: "Varnam",
    text: "A typical Carnatic kutcheri often opens with a…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Varnam",
    options: ["Varnam", "Thillana", "Pallavi only", "Mangalam"],
    offsetHours: -36,
    durationHours: 2,
  },
  {
    number: 178,
    title: "Silappatikaram",
    text: "Which Tamil epic follows Kannagi’s demand for justice in Madurai?",
    type: "TEXT",
    category: "literature",
    difficulty: "MEDIUM",
    answer: "Silappatikaram",
    variants: ["silappathikaram", "cilappatikaram", "silapathikaram"],
    offsetHours: -32,
    durationHours: 2,
  },
  {
    number: 179,
    title: "Mayamalavagowla",
    text: "The first raga typically taught in Carnatic vocal training is…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Mayamalavagowla",
    options: ["Mayamalavagowla", "Kalyani", "Bhairavi", "Kharaharapriya"],
    offsetHours: -30,
    durationHours: 2,
  },
  {
    number: 180,
    title: "T Nagar",
    text: "T. Nagar is named after which public figure?",
    type: "MULTIPLE_CHOICE",
    category: "chennai",
    difficulty: "HARD",
    answer: "Sir P. Theagaraya Chetty",
    options: [
      "Sir P. Theagaraya Chetty",
      "S. Satyamurti",
      "C. N. Annadurai",
      "Rajaji",
    ],
    offsetHours: -26,
    durationHours: 2,
  },
  {
    number: 181,
    title: "Nadaswaram",
    text: "The nadaswaram is most traditionally heard at…",
    type: "MULTIPLE_CHOICE",
    category: "traditions",
    difficulty: "EASY",
    answer: "Weddings and temples",
    options: [
      "Weddings and temples",
      "Only film recording studios",
      "Boat races",
      "Courtrooms",
    ],
    offsetHours: -22,
    durationHours: 2,
  },
  {
    number: 182,
    title: "Vatapi",
    text: "“Vatapi Ganapatim” is a composition of…",
    type: "TEXT",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Muthuswami Dikshitar",
    variants: ["dikshitar", "muthuswami dikshitar", "m dikshitar"],
    offsetHours: -18,
    durationHours: 2,
  },
  {
    number: 183,
    title: "Thani",
    text: "In a kutcheri, thani avarthanam is…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "The percussion solo",
    options: [
      "The percussion solo",
      "The drone tuning",
      "The encore thillana",
      "The composer’s stamp",
    ],
    offsetHours: -8,
    durationHours: 2,
  },
  {
    number: 184,
    title: "Padmanabha mudra",
    text: "Which composer is identified by the mudra “Padmanabha”?",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Swathi Thirunal",
    options: ["Swathi Thirunal", "Tyagaraja", "Papanasam Sivan", "Gopalakrishna Bharati"],
    offsetHours: -0.4,
    durationHours: 2,
  },
  {
    number: 185,
    title: "Kanchipuram",
    text: "Kanchipuram is world-famous for which woven tradition?",
    type: "TEXT",
    category: "traditions",
    difficulty: "EASY",
    answer: "Silk sarees",
    variants: ["kanjivaram", "kanjeevaram silk", "silk", "sarees", "sari"],
    offsetHours: 2,
    durationHours: 2,
  },
  {
    number: 186,
    title: "Chidambaram",
    text: "The classical Nataraja of the cosmic dance is most closely tied to which town?",
    type: "MULTIPLE_CHOICE",
    category: "temples",
    difficulty: "MEDIUM",
    answer: "Chidambaram",
    options: ["Chidambaram", "Kumbakonam", "Srirangam", "Madurai"],
    offsetHours: 4,
    durationHours: 2,
  },
  {
    number: 187,
    title: "Alapana",
    text: "An alapana is best described as…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "MEDIUM",
    answer: "Unmetered raga improvisation",
    options: [
      "Unmetered raga improvisation",
      "A fixed tala cycle only",
      "A percussion cipher",
      "A concert interval",
    ],
    offsetHours: 6,
    durationHours: 2,
  },
  {
    number: 188,
    title: "Puthandu",
    text: "Tamil New Year is known as…",
    type: "TEXT",
    category: "festivals",
    difficulty: "EASY",
    answer: "Puthandu",
    variants: ["puthandu", "varusha pirappu", "chithirai puthandu"],
    offsetHours: 8,
    durationHours: 2,
  },
  {
    number: 189,
    title: "Mridangam",
    text: "The mridangam is classified as which family of instrument?",
    type: "MULTIPLE_CHOICE",
    category: "objects",
    difficulty: "EASY",
    answer: "Percussion",
    options: ["Percussion", "Wind", "Bowed string", "Plucked drone"],
    offsetHours: 10,
    durationHours: 2,
  },
  {
    number: 190,
    title: "December season",
    text: "Chennai’s December music season falls in the Tamil month of…",
    type: "MULTIPLE_CHOICE",
    category: "chennai",
    difficulty: "MEDIUM",
    answer: "Margazhi",
    options: ["Margazhi", "Thai", "Aadi", "Panguni"],
    offsetHours: 12,
    durationHours: 2,
  },
  {
    number: 191,
    title: "Amritavarshini",
    text: "Which Carnatic raga is traditionally associated with invoking rain?",
    type: "TEXT",
    category: "carnatic-music",
    difficulty: "HARD",
    answer: "Amritavarshini",
    variants: ["amruthavarshini", "amrita varshini"],
    offsetHours: 26,
    durationHours: 2,
  },
  {
    number: 192,
    title: "Bharatanatyam",
    text: "The principal classical dance taught at Kalakshetra is…",
    type: "MULTIPLE_CHOICE",
    category: "indian-classical-arts",
    difficulty: "EASY",
    answer: "Bharatanatyam",
    options: ["Bharatanatyam", "Kathak", "Odissi", "Kuchipudi"],
    offsetHours: 28,
    durationHours: 2,
  },
  {
    number: 193,
    title: "Thiruvaiyaru",
    text: "Tyagaraja’s aradhana, where the Pancharatna kritis are sung in chorus, is held at…",
    type: "TEXT",
    category: "places",
    difficulty: "MEDIUM",
    answer: "Thiruvaiyaru",
    variants: ["tiruvaiyaru", "thiruvaiyar", "tiruvaiyar"],
    offsetHours: 30,
    durationHours: 2,
  },
  {
    number: 194,
    title: "Neraval",
    text: "Neraval in a Carnatic concert is…",
    type: "MULTIPLE_CHOICE",
    category: "carnatic-music",
    difficulty: "HARD",
    answer: "Improvisation on a chosen line of the composition",
    options: [
      "Improvisation on a chosen line of the composition",
      "Tuning the tanpura",
      "The final mangalam only",
      "A list of ragas",
    ],
    offsetHours: 32,
    durationHours: 2,
  },
];

function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function between(seed: string, min: number, max: number) {
  const n = hash(seed) % 10_000;
  return min + (n / 10_000) * (max - min);
}

export async function seedKelvi(db: PrismaClient) {
  const now = new Date();
  const parts = zonedParts(now);

  await db.livePresence.deleteMany();
  await db.playerAchievement.deleteMany();
  await db.reward.deleteMany();
  await db.weeklyScore.deleteMany();
  await db.playerCategoryStats.deleteMany();
  await db.playerGameStats.deleteMany();
  await db.attempt.deleteMany();
  await db.gameSession.deleteMany();
  await db.questionOption.deleteMany();
  await db.question.deleteMany();
  await db.magicLink.deleteMany();
  await db.account.deleteMany();
  await db.session.deleteMany();
  await db.player.deleteMany();
  await db.achievement.deleteMany();
  await db.category.deleteMany();
  await db.venue.deleteMany();
  await db.game.deleteMany();
  await db.appConfig.deleteMany();

  for (const [slug, name] of GAMES) {
    await db.game.create({ data: { slug, name } });
  }
  const kelvi = await db.game.findUniqueOrThrow({ where: { slug: "kelvi" } });

  const categoryBySlug = new Map<string, string>();
  for (const [slug, name] of CATEGORIES) {
    const row = await db.category.create({ data: { slug, name } });
    categoryBySlug.set(slug, row.id);
  }

  for (const [slug, name, city, type] of VENUES) {
    await db.venue.create({ data: { slug, name, city, type } });
  }

  for (const achievement of ACHIEVEMENTS) {
    await db.achievement.create({ data: achievement });
  }

  await db.appConfig.create({
    data: {
      key: "kelvi.scoring",
      value: DEFAULT_SCORING as object,
    },
  });

  const questionIds = new Map<number, string>();
  for (const item of QUESTIONS) {
    const releaseAt = new Date(now.getTime() + item.offsetHours * 60 * 60 * 1000);
    const expireAt = new Date(releaseAt.getTime() + item.durationHours * 60 * 60 * 1000);
    const created = await db.question.create({
      data: {
        gameId: kelvi.id,
        number: item.number,
        internalTitle: item.title,
        questionText: item.text,
        questionType: item.type,
        categoryId: categoryBySlug.get(item.category)!,
        difficulty: item.difficulty,
        correctAnswer: item.answer,
        acceptableAnswers: item.variants ?? [],
        releaseAt,
        expireAt,
        status: "SCHEDULED",
        competitive: true,
        scoringConfig: DEFAULT_SCORING as object,
        options: item.options
          ? {
              create: item.options.map((text, index) => ({
                text,
                isCorrect: text === item.answer,
                sortOrder: index,
              })),
            }
          : undefined,
      },
    });
    questionIds.set(item.number, created.id);
  }

  const admin = await db.player.create({
    data: {
      email: "admin@aarla.play",
      displayName: "Aarla",
      name: "Aarla",
      city: "Chennai",
      isAdmin: true,
      isGuest: false,
      emailVerified: now,
    },
  });

  const playerRows = [];
  for (const [displayName, email, city] of PLAYERS) {
    playerRows.push(
      await db.player.create({
        data: {
          email,
          displayName,
          name: displayName,
          city,
          isGuest: false,
          emailVerified: now,
        },
      }),
    );
  }

  const pastQuestions = QUESTIONS.filter((item) => item.number !== 184 && item.offsetHours < 0);
  const liveQuestion = QUESTIONS.find((item) => item.number === 184)!;

  for (const player of playerRows) {
    let streak = 0;
    let bestStreak = 0;
    let totalPlayed = 0;
    let totalCorrect = 0;
    let totalScore = 0;
    let bestResponseMs: number | null = null;
    const weekPoints = new Map<string, { points: number; attempted: number; correct: number; totalResponseMs: number }>();
    const categoryAcc = new Map<string, { played: number; correct: number }>();

    for (const question of pastQuestions) {
      const qid = questionIds.get(question.number)!;
      const releaseAt = new Date(now.getTime() + question.offsetHours * 60 * 60 * 1000);
      const skill = between(`${player.displayName}-skill`, 0.55, 0.97);
      const correct = between(`${player.displayName}-${question.number}-c`, 0, 1) < skill;
      const responseMs = Math.round(
        between(`${player.displayName}-${question.number}-t`, 1400, correct ? 9800 : 18000),
      );
      const startedAt = new Date(releaseAt.getTime() + 30_000 + hash(player.id + question.number) % 120_000);
      const submittedAt = new Date(startedAt.getTime() + responseMs);
      const score = correct
        ? 100 +
          (responseMs <= 3000
            ? 50
            : responseMs <= 5000
              ? 40
              : responseMs <= 10000
                ? 30
                : responseMs <= 20000
                  ? 20
                  : 10)
        : 0;

      await db.attempt.create({
        data: {
          playerId: player.id,
          questionId: qid,
          startedAt,
          submittedAt,
          responseMs,
          answer: correct ? question.answer : "—",
          correct,
          score,
          attemptCount: 1,
        },
      });

      totalPlayed += 1;
      if (correct) {
        totalCorrect += 1;
        totalScore += score;
        streak += 1;
        bestStreak = Math.max(bestStreak, streak);
        bestResponseMs = bestResponseMs == null ? responseMs : Math.min(bestResponseMs, responseMs);
      } else {
        streak = 0;
      }

      const weekStart = getWeekStart(submittedAt);
      const key = weekStart.toISOString();
      const bucket = weekPoints.get(key) ?? { points: 0, attempted: 0, correct: 0, totalResponseMs: 0 };
      bucket.points += score;
      bucket.attempted += 1;
      if (correct) {
        bucket.correct += 1;
        bucket.totalResponseMs += responseMs;
      }
      weekPoints.set(key, bucket);

      const cat = categoryAcc.get(question.category) ?? { played: 0, correct: 0 };
      cat.played += 1;
      if (correct) cat.correct += 1;
      categoryAcc.set(question.category, cat);
    }

    const playLive = between(`${player.displayName}-live`, 0, 1) > 0.35;
    if (playLive) {
      const qid = questionIds.get(184)!;
      const responseMs = Math.round(between(`${player.displayName}-184-t`, 1600, 7200));
      const startedAt = new Date(now.getTime() - responseMs - 20_000);
      await db.attempt.create({
        data: {
          playerId: player.id,
          questionId: qid,
          startedAt,
          submittedAt: new Date(startedAt.getTime() + responseMs),
          responseMs,
          answer: liveQuestion.answer,
          correct: true,
          score: responseMs <= 3000 ? 150 : responseMs <= 5000 ? 140 : 130,
          attemptCount: 1,
        },
      });
      await db.livePresence.create({
        data: {
          questionId: qid,
          playerId: player.id,
          lastSeenAt: new Date(now.getTime() - (hash(player.id) % 40_000)),
        },
      });
      totalPlayed += 1;
      totalCorrect += 1;
      totalScore += responseMs <= 3000 ? 150 : 140;
      streak += 1;
      bestStreak = Math.max(bestStreak, streak);
      bestResponseMs = bestResponseMs == null ? responseMs : Math.min(bestResponseMs, responseMs);
    }

    await db.playerGameStats.create({
      data: {
        playerId: player.id,
        gameId: kelvi.id,
        currentStreak: streak,
        bestStreak,
        totalPlayed,
        totalCorrect,
        totalScore,
        bestResponseMs,
        lastPlayedAt: now,
      },
    });

    for (const [slug, acc] of categoryAcc) {
      await db.playerCategoryStats.create({
        data: {
          playerId: player.id,
          categoryId: categoryBySlug.get(slug)!,
          played: acc.played,
          correct: acc.correct,
        },
      });
    }

    for (const [key, bucket] of weekPoints) {
      await db.weeklyScore.create({
        data: {
          playerId: player.id,
          gameId: kelvi.id,
          weekStart: new Date(key),
          ...bucket,
        },
      });
    }

    const achievements = await db.achievement.findMany();
    const codes: string[] = [];
    if (bestStreak >= 3) codes.push("STREAK_3");
    if (bestStreak >= 7) codes.push("STREAK_7");
    if (player.displayName === "Karthik") codes.push("FASTEST_FINGERS", "FIRST_TOP_10");
    if (player.displayName === "Meera") codes.push("FIRST_TOP_10");
    for (const code of codes) {
      const achievement = achievements.find((row) => row.code === code);
      if (!achievement) continue;
      await db.playerAchievement.create({
        data: { playerId: player.id, achievementId: achievement.id },
      });
    }
  }

  const lastWeek = new Date(getWeekStart(now).getTime() - 7 * 24 * 60 * 60 * 1000);
  const meera = playerRows.find((p) => p.displayName === "Meera")!;
  await db.reward.create({
    data: {
      weekStart: lastWeek,
      type: "WEEKLY_CHAMPION",
      playerId: meera.id,
      voucherCode: "AARLA-K7M2-9QPD",
      voucherAmount: 1000,
      issuedAt: lastWeek,
      expiresAt: new Date(lastWeek.getTime() + 90 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`Seeded Kelvi with ${QUESTIONS.length} questions, ${playerRows.length} players, admin ${admin.email}.`);
  console.log(`Local time parts: ${parts.weekday} ${parts.day}/${parts.month} ${parts.hour}:${parts.minute} IST-ish`);
}

async function main() {
  const db = new PrismaClient({
    datasources: { db: { url: resolveDirectUrl() } },
  });
  try {
    await seedKelvi(db);
  } finally {
    await db.$disconnect();
  }
}

const isCli = /seed\.(ts|js)$/.test(process.argv[1] ?? "");
if (isCli) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
