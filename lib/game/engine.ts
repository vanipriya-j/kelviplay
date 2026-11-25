import { Prisma, type PrismaClient } from "@prisma/client";
import { getAnswerVideo } from "./answer-video";
import { gradeAnswer } from "./answers";
import { ACHIEVEMENTS, categoryBadgeProgress, streakAchievementCode } from "./achievements";
import { percentileFaster, rankFasterFingers } from "./leaderboard";
import { getPeriodStandings, standingsWindows } from "./standings";
import { rateLimit } from "../rate-limit";
import {
  computeScore,
  hitMilestones,
  KELVI_SLUG,
  nextStreak,
  parseScoringConfig,
  PRESENCE_TTL_MS,
  type StreakRule,
} from "./scoring";
import { getDayStart, getWeekStart, isLiveAt } from "./time";

const LIVE_SELECT = {
  id: true,
  number: true,
  questionText: true,
  questionType: true,
  mediaUrl: true,
  mediaKind: true,
  releaseAt: true,
  expireAt: true,
  status: true,
  competitive: true,
  scoringConfig: true,
  streakRule: true,
  correctAnswer: true,
  acceptableAnswers: true,
  categoryId: true,
  gameId: true,
  options: {
    select: { id: true, text: true, isCorrect: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
} satisfies Prisma.QuestionSelect;

export class GameError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

type CachedGame = NonNullable<Awaited<ReturnType<PrismaClient["game"]["findUnique"]>>>;
let gameCache: { game: CachedGame; expiresAt: number } | null = null;

export async function getKelviGame(db: PrismaClient) {
  const cached = gameCache;
  if (cached && cached.expiresAt > Date.now()) return cached.game;
  const game = await db.game.findUnique({ where: { slug: KELVI_SLUG } });
  if (!game) throw new GameError("NO_GAME", "Kelvi has not been seeded.");
  gameCache = { game, expiresAt: Date.now() + 60_000 };
  return game;
}

export async function getLiveHeadline(db: PrismaClient, now = new Date()) {
  return db.question.findFirst({
    where: {
      game: { slug: KELVI_SLUG },
      status: { notIn: ["DRAFT", "ARCHIVED"] },
      releaseAt: { lte: now },
      expireAt: { gt: now },
    },
    orderBy: { releaseAt: "desc" },
    select: { id: true, number: true, expireAt: true },
  });
}

export async function getLiveQuestion(db: PrismaClient, now = new Date()) {
  const question = await db.question.findFirst({
    where: {
      game: { slug: KELVI_SLUG },
      status: { notIn: ["DRAFT", "ARCHIVED"] },
      releaseAt: { lte: now },
      expireAt: { gt: now },
    },
    orderBy: { releaseAt: "desc" },
    include: {
      options: { orderBy: { sortOrder: "asc" } },
      category: true,
    },
  });
  return question;
}

export async function getNextQuestion(db: PrismaClient, now = new Date()) {
  return db.question.findFirst({
    where: {
      game: { slug: KELVI_SLUG },
      status: { notIn: ["DRAFT", "ARCHIVED"] },
      releaseAt: { gt: now },
    },
    orderBy: { releaseAt: "asc" },
  });
}

export async function countPlaying(db: PrismaClient, questionId: string, now = new Date()) {
  const since = new Date(now.getTime() - PRESENCE_TTL_MS);
  return db.livePresence.count({
    where: {
      questionId,
      lastSeenAt: { gte: since },
      player: { attempts: { none: { questionId, submittedAt: { not: null } } } },
    },
  });
}

export async function heartbeatPresence(
  db: PrismaClient,
  input: { questionId: string; playerId: string },
) {
  await db.livePresence.upsert({
    where: {
      questionId_playerId: {
        questionId: input.questionId,
        playerId: input.playerId,
      },
    },
    update: { lastSeenAt: new Date() },
    create: {
      questionId: input.questionId,
      playerId: input.playerId,
      lastSeenAt: new Date(),
    },
  });
}

export async function openKelvi(
  db: PrismaClient,
  input: { playerId: string; venueId?: string | null },
) {
  if (!rateLimit(`open:${input.playerId}`, 12, 60_000)) {
    throw new GameError("RATE_LIMIT", "Easy. The Kelvi will wait a breath.");
  }

  const live = await getLiveQuestion(db);
  if (!live) {
    throw new GameError("NOT_LIVE", "There is no live Kelvi right now.");
  }

  const existing = await db.attempt.findUnique({
    where: {
      playerId_questionId: { playerId: input.playerId, questionId: live.id },
    },
  });

  if (existing?.submittedAt) {
    return {
      alreadySubmitted: true as const,
      attemptId: existing.id,
      questionId: live.id,
    };
  }

  let attempt = existing;
  if (!attempt) {
    const game = await getKelviGame(db);
    const session = await db.gameSession.create({
      data: {
        playerId: input.playerId,
        gameId: game.id,
        venueId: input.venueId ?? null,
      },
    });
    try {
      attempt = await db.attempt.create({
        data: {
          playerId: input.playerId,
          questionId: live.id,
          gameSessionId: session.id,
          venueId: input.venueId ?? null,
          startedAt: new Date(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        attempt = await db.attempt.findUnique({
          where: {
            playerId_questionId: { playerId: input.playerId, questionId: live.id },
          },
        });
      }
      if (!attempt) throw error;
    }
  }

  await heartbeatPresence(db, { questionId: live.id, playerId: input.playerId });

  return {
    alreadySubmitted: false as const,
    attemptId: attempt.id,
    startedAt: attempt.startedAt.toISOString(),
    expireAt: live.expireAt.toISOString(),
    question: {
      id: live.id,
      number: live.number,
      title: live.internalTitle,
      questionText: live.questionText,
      questionType: live.questionType,
      category: live.category.name,
      mediaUrl: live.mediaUrl,
      mediaKind: live.mediaKind,
      options: live.options.map((option) => ({
        id: option.id,
        text: option.text,
        sortOrder: option.sortOrder,
      })),
    },
  };
}

export async function submitKelvi(
  db: PrismaClient,
  input: {
    playerId: string;
    questionId: string;
    answer: string;
    clientOpenedAt?: string | null;
    clientSubmittedAt?: string | null;
  },
) {
  if (!rateLimit(`submit:${input.playerId}`, 8, 60_000)) {
    throw new GameError("RATE_LIMIT", "Already locked in.");
  }

  const attempt = await db.attempt.findUnique({
    where: {
      playerId_questionId: {
        playerId: input.playerId,
        questionId: input.questionId,
      },
    },
  });

  if (!attempt) {
    throw new GameError("NO_ATTEMPT", "Open the Kelvi before answering.");
  }
  if (attempt.submittedAt) {
    return { alreadySubmitted: true as const, attemptId: attempt.id };
  }

  const question = await db.question.findUnique({
    where: { id: input.questionId },
    select: LIVE_SELECT,
  });
  if (!question) throw new GameError("NO_QUESTION", "That Kelvi is gone.");

  if (attempt.startedAt < question.releaseAt) {
    throw new GameError("INVALID_WINDOW", "This attempt is not valid.");
  }

  const now = new Date();
  const responseMs = Math.max(0, now.getTime() - attempt.startedAt.getTime());
  const correct = gradeAnswer({
    questionType: question.questionType,
    submitted: input.answer,
    correctAnswer: question.correctAnswer,
    acceptableAnswers: question.acceptableAnswers,
    options: question.options,
  });
  const scoring = parseScoringConfig(question.scoringConfig);
  const scored = computeScore({ correct, responseMs, scoring });
  const competitive = question.competitive && isLiveAt(question, attempt.startedAt) && isLiveAt(question, now);

  const locked = await db.attempt.updateMany({
    where: { id: attempt.id, submittedAt: null },
    data: {
      submittedAt: now,
      clientOpenedAt: input.clientOpenedAt ? new Date(input.clientOpenedAt) : null,
      clientSubmittedAt: input.clientSubmittedAt
        ? new Date(input.clientSubmittedAt)
        : null,
      responseMs: competitive ? responseMs : null,
      answer: input.answer.slice(0, 280),
      correct,
      score: competitive ? scored.score : 0,
      attemptCount: 1,
    },
  });

  if (locked.count === 0) {
    const raced = await db.attempt.findUnique({ where: { id: attempt.id } });
    return { alreadySubmitted: true as const, attemptId: raced?.id ?? attempt.id };
  }

  if (competitive) {
    await applyProgress(db, {
      playerId: input.playerId,
      gameId: question.gameId,
      categoryId: question.categoryId,
      correct,
      score: scored.score,
      responseMs,
      streakRule: question.streakRule as StreakRule,
      submittedAt: now,
    });
    await maybeAwardAchievements(db, {
      playerId: input.playerId,
      questionId: question.id,
      correct,
      responseMs,
    });
  }

  return { alreadySubmitted: false as const, attemptId: attempt.id };
}

async function applyProgress(
  db: PrismaClient,
  input: {
    playerId: string;
    gameId: string;
    categoryId: string;
    correct: boolean;
    score: number;
    responseMs: number;
    streakRule: StreakRule;
    submittedAt: Date;
  },
) {
  const weekStart = getWeekStart(input.submittedAt);
  const stats = await db.playerGameStats.findUnique({
    where: {
      playerId_gameId: { playerId: input.playerId, gameId: input.gameId },
    },
  });
  const currentStreak = nextStreak(stats?.currentStreak ?? 0, input.correct, input.streakRule);
  const bestStreak = Math.max(stats?.bestStreak ?? 0, currentStreak);
  const bestResponseMs =
    input.correct && input.responseMs > 0
      ? Math.min(stats?.bestResponseMs ?? input.responseMs, input.responseMs)
      : stats?.bestResponseMs ?? null;

  await db.$transaction([
    db.playerGameStats.upsert({
      where: {
        playerId_gameId: { playerId: input.playerId, gameId: input.gameId },
      },
      create: {
        playerId: input.playerId,
        gameId: input.gameId,
        currentStreak,
        bestStreak,
        totalPlayed: 1,
        totalCorrect: input.correct ? 1 : 0,
        totalScore: input.score,
        bestResponseMs,
        lastPlayedAt: new Date(),
      },
      update: {
        currentStreak,
        bestStreak,
        totalPlayed: { increment: 1 },
        totalCorrect: { increment: input.correct ? 1 : 0 },
        totalScore: { increment: input.score },
        bestResponseMs,
        lastPlayedAt: new Date(),
      },
    }),
    db.playerCategoryStats.upsert({
      where: {
        playerId_categoryId: {
          playerId: input.playerId,
          categoryId: input.categoryId,
        },
      },
      create: {
        playerId: input.playerId,
        categoryId: input.categoryId,
        played: 1,
        correct: input.correct ? 1 : 0,
      },
      update: {
        played: { increment: 1 },
        correct: { increment: input.correct ? 1 : 0 },
      },
    }),
    db.weeklyScore.upsert({
      where: {
        playerId_gameId_weekStart: {
          playerId: input.playerId,
          gameId: input.gameId,
          weekStart,
        },
      },
      create: {
        playerId: input.playerId,
        gameId: input.gameId,
        weekStart,
        points: input.score,
        attempted: 1,
        correct: input.correct ? 1 : 0,
        totalResponseMs: input.correct ? input.responseMs : 0,
      },
      update: {
        points: { increment: input.score },
        attempted: { increment: 1 },
        correct: { increment: input.correct ? 1 : 0 },
        totalResponseMs: { increment: input.correct ? input.responseMs : 0 },
      },
    }),
  ]);
}

async function maybeAwardAchievements(
  db: PrismaClient,
  input: { playerId: string; questionId: string; correct: boolean; responseMs: number },
) {
  const game = await getKelviGame(db);
  const stats = await db.playerGameStats.findUnique({
    where: { playerId_gameId: { playerId: input.playerId, gameId: game.id } },
  });
  const codes = new Set<string>();

  if (stats) {
    for (const milestone of hitMilestones(stats.currentStreak - (input.correct ? 1 : 0), stats.currentStreak)) {
      const code = streakAchievementCode(milestone);
      if (code) codes.add(code);
    }
  }

  if (input.correct) {
    const correctAttempts = await db.attempt.findMany({
      where: {
        questionId: input.questionId,
        correct: true,
        submittedAt: { not: null },
        responseMs: { not: null },
      },
      select: { playerId: true, responseMs: true },
    });
    const ranked = rankFasterFingers(
      correctAttempts.map((row) => ({
        playerId: row.playerId,
        displayName: "",
        responseMs: row.responseMs ?? Number.MAX_SAFE_INTEGER,
      })),
      input.playerId,
    );
    const you = ranked.find((row) => row.isYou);
    if (you && you.rank <= 10) codes.add("FIRST_TOP_10");
    if (you && you.rank === 1) codes.add("FASTEST_FINGERS");
  }

  const dayStart = getDayStart();
  const todays = await db.attempt.findMany({
    where: {
      playerId: input.playerId,
      submittedAt: { gte: dayStart },
      question: { game: { slug: KELVI_SLUG } },
    },
    select: { correct: true },
  });
  if (todays.length >= 2 && todays.every((row) => row.correct)) {
    codes.add("PERFECT_DAY");
  }

  if (!codes.size) return;

  const achievements = await db.achievement.findMany({
    where: { code: { in: [...codes] } },
  });
  if (!achievements.length) return;

  const existing = await db.playerAchievement.findMany({
    where: {
      playerId: input.playerId,
      achievementId: { in: achievements.map((item) => item.id) },
    },
    select: { achievementId: true },
  });
  const have = new Set(existing.map((row) => row.achievementId));
  const fresh = achievements.filter((item) => !have.has(item.id));
  if (!fresh.length) return;
  await db.playerAchievement.createMany({
    data: fresh.map((achievement) => ({
      playerId: input.playerId,
      achievementId: achievement.id,
    })),
  });
}

export async function getAttemptResult(db: PrismaClient, attemptId: string, playerId: string) {
  const attempt = await db.attempt.findUnique({
    where: { id: attemptId },
    include: {
      player: true,
      question: { include: { category: true } },
    },
  });
  if (!attempt || attempt.playerId !== playerId) return null;
  if (!attempt.submittedAt) return null;

  const game = await getKelviGame(db);
  const stats = await db.playerGameStats.findUnique({
    where: { playerId_gameId: { playerId, gameId: game.id } },
  });

  const correctAttempts = await db.attempt.findMany({
    where: {
      questionId: attempt.questionId,
      correct: true,
      submittedAt: { not: null },
      responseMs: { not: null },
    },
    include: { player: { select: { id: true, displayName: true } } },
  });

  const ranked = rankFasterFingers(
    correctAttempts.map((row) => ({
      playerId: row.playerId,
      displayName: row.player.displayName,
      responseMs: row.responseMs ?? Number.MAX_SAFE_INTEGER,
    })),
    playerId,
  );
  const you = ranked.find((row) => row.isYou) ?? null;
  const top = ranked.slice(0, 10);
  const inTop = top.some((row) => row.isYou);
  const board = inTop ? top : you ? [...top, you] : top;

  const weekly = await getPeriodStandings(db, standingsWindows("week", new Date()).current, playerId);
  const weeklyRank = weekly.find((row) => row.isYou)?.rank ?? null;

  const [earned, categoryStats, answerVideoUrl] = await Promise.all([
    db.playerAchievement.findMany({
      where: { playerId, earnedAt: { gte: new Date(Date.now() - 60_000) } },
      include: { achievement: true },
      orderBy: { earnedAt: "desc" },
    }),
    attempt.correct && attempt.responseMs !== null
      ? db.playerCategoryStats.findUnique({
          where: { playerId_categoryId: { playerId, categoryId: attempt.question.categoryId } },
          select: { correct: true },
        })
      : null,
    attempt.question.expireAt.getTime() <= Date.now()
      ? getAnswerVideo(db, attempt.question.id)
      : null,
  ]);
  const badge = categoryStats
    ? { correct: categoryStats.correct, ...categoryBadgeProgress(categoryStats.correct) }
    : null;

  return {
    attempt: {
      id: attempt.id,
      correct: Boolean(attempt.correct),
      score: attempt.score,
      responseMs: attempt.responseMs,
      submittedAt: attempt.submittedAt.toISOString(),
    },
    question: {
      id: attempt.question.id,
      number: attempt.question.number,
      competitive: attempt.question.competitive,
      category: attempt.question.category.name,
    },
    rank: you?.rank ?? null,
    percentile: you ? percentileFaster(you.rank, ranked.length) : null,
    categoryBadge: badge,
    answerVideoUrl,
    fasterFingers: board,
    fasterFingersTotal: ranked.length,
    streak: stats?.currentStreak ?? 0,
    bestStreak: stats?.bestStreak ?? 0,
    weeklyRank: weeklyRank || null,
    weeklyPoints: weekly.find((row) => row.playerId === playerId)?.points ?? 0,
    displayName: attempt.player.displayName,
    isGuest: attempt.player.isGuest,
    recentAchievements: earned.map((row) => ({
      code: row.achievement.code,
      name: row.achievement.name,
    })),
  };
}

export { ACHIEVEMENTS };
