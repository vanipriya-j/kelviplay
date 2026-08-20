import type { PrismaClient } from "@prisma/client";
import { rankWeekly } from "./leaderboard";
import { KELVI_SLUG, nextMilestone, PRESENCE_TTL_MS } from "./scoring";
import { formatWindowLabel, getDayStart, getWeekStart } from "./time";
import { countPlaying, getKelviGame, getLiveQuestion, getNextQuestion } from "./engine";
import { publicName } from "../utils";

export async function getHomeState(db: PrismaClient, playerId?: string | null) {
  const now = new Date();
  const [live, next, game, player] = await Promise.all([
    getLiveQuestion(db, now),
    getNextQuestion(db, now),
    getKelviGame(db),
    playerId
      ? db.player.findUnique({
          where: { id: playerId },
          select: {
            id: true,
            displayName: true,
            isGuest: true,
            isAdmin: true,
            image: true,
          },
        })
      : null,
  ]);

  const stats = playerId
    ? await db.playerGameStats.findUnique({
        where: { playerId_gameId: { playerId, gameId: game.id } },
      })
    : null;

  const weekStart = getWeekStart(now);
  const weeklyRows = await db.weeklyScore.findMany({
    where: { gameId: game.id, weekStart },
    include: { player: { select: { id: true, displayName: true } } },
  });
  const weekly = rankWeekly(
    weeklyRows.map((row) => ({
      playerId: row.playerId,
      displayName: publicName(row.player.displayName),
      points: row.points,
      attempted: row.attempted,
      correct: row.correct,
      totalResponseMs: row.totalResponseMs,
    })),
    playerId,
  );
  const youWeekly = weekly.find((row) => row.isYou) ?? null;

  const dayStart = getDayStart(now);
  const [todayCompleted, todayScheduled, recentAchievements, attempt] = await Promise.all([
    playerId
      ? db.attempt.count({
          where: {
            playerId,
            submittedAt: { not: null },
            question: { gameId: game.id, releaseAt: { gte: dayStart } },
          },
        })
      : 0,
    db.question.count({
      where: {
        gameId: game.id,
        status: { notIn: ["DRAFT", "ARCHIVED"] },
        releaseAt: { gte: dayStart, lte: new Date(dayStart.getTime() + 24 * 60 * 60 * 1000) },
      },
    }),
    playerId
      ? db.playerAchievement.findMany({
          where: { playerId },
          include: { achievement: true },
          orderBy: { earnedAt: "desc" },
          take: 3,
        })
      : [],
    live && playerId
      ? db.attempt.findUnique({
          where: { playerId_questionId: { playerId, questionId: live.id } },
        })
      : null,
  ]);

  const playingCount = live ? await countPlaying(db, live.id, now) : 0;

  return {
    player: player
      ? {
          id: player.id,
          displayName: publicName(player.displayName),
          isGuest: player.isGuest,
          isAdmin: player.isAdmin,
          image: player.image,
        }
      : null,
    live: live
      ? {
          questionId: live.id,
          number: live.number,
          playingCount,
          endsAt: live.expireAt.toISOString(),
          alreadyPlayed: Boolean(attempt?.submittedAt),
          attemptId: attempt?.submittedAt ? attempt.id : undefined,
        }
      : null,
    next: next
      ? {
          number: next.number,
          windowLabel: formatWindowLabel(next.releaseAt, next.expireAt),
          releaseAt: next.releaseAt.toISOString(),
        }
      : null,
    stats: {
      currentStreak: stats?.currentStreak ?? 0,
      bestStreak: stats?.bestStreak ?? 0,
      weeklyRank: youWeekly?.rank ?? null,
      weeklyPoints: youWeekly?.points ?? 0,
      nextMilestone: nextMilestone(stats?.currentStreak ?? 0),
      todayCompleted,
      todayTotal: todayScheduled,
    },
    weeklyPreview: weekly.slice(0, 3),
    youWeekly,
    recentAchievements: recentAchievements.map((row) => ({
      code: row.achievement.code,
      name: row.achievement.name,
      earnedAt: row.earnedAt.toISOString(),
    })),
    presenceTtlMs: PRESENCE_TTL_MS,
  };
}

export async function getLeaderboardState(db: PrismaClient, playerId?: string | null) {
  const now = new Date();
  const [live, game] = await Promise.all([getLiveQuestion(db, now), getKelviGame(db)]);
  const weekStart = getWeekStart(now);

  const weeklyRows = await db.weeklyScore.findMany({
    where: { gameId: game.id, weekStart },
    include: { player: { select: { id: true, displayName: true } } },
  });
  const weekly = rankWeekly(
    weeklyRows.map((row) => ({
      playerId: row.playerId,
      displayName: publicName(row.player.displayName),
      points: row.points,
      attempted: row.attempted,
      correct: row.correct,
      totalResponseMs: row.totalResponseMs,
    })),
    playerId,
  );

  let fasterFingers: ReturnType<typeof import("./leaderboard").rankFasterFingers> = [];
  let liveNumber: number | null = null;
  if (live) {
    liveNumber = live.number;
    const { rankFasterFingers } = await import("./leaderboard");
    const attempts = await db.attempt.findMany({
      where: {
        questionId: live.id,
        correct: true,
        submittedAt: { not: null },
        responseMs: { not: null },
      },
      include: { player: { select: { id: true, displayName: true } } },
    });
    const ranked = rankFasterFingers(
      attempts.map((row) => ({
        playerId: row.playerId,
        displayName: publicName(row.player.displayName),
        responseMs: row.responseMs ?? Number.MAX_SAFE_INTEGER,
      })),
      playerId,
    );
    const top = ranked.slice(0, 10);
    const you = ranked.find((row) => row.isYou);
    fasterFingers = you && !top.some((row) => row.isYou) ? [...top, you] : top;
  }

  const youWeekly = weekly.find((row) => row.isYou) ?? null;
  const stats = playerId
    ? await db.playerGameStats.findUnique({
        where: { playerId_gameId: { playerId, gameId: game.id } },
      })
    : null;

  return {
    liveNumber,
    fasterFingers,
    weekly: weekly.slice(0, 25),
    weeklyTotal: weekly.length,
    youWeekly,
    you: stats
      ? {
          currentStreak: stats.currentStreak,
          attempted: youWeekly?.attempted ?? 0,
          correct: youWeekly?.correct ?? 0,
          avgResponseMs: youWeekly?.avgResponseMs ?? null,
        }
      : null,
  };
}

export async function getProfileState(db: PrismaClient, playerId: string) {
  const [player, game] = await Promise.all([
    db.player.findUnique({ where: { id: playerId } }),
    getKelviGame(db),
  ]);
  if (!player) return null;

  const [stats, categories, weekStart] = await Promise.all([
    db.playerGameStats.findUnique({
      where: { playerId_gameId: { playerId, gameId: game.id } },
    }),
    db.playerCategoryStats.findMany({
      where: { playerId },
      include: { category: true },
      orderBy: { played: "desc" },
    }),
    Promise.resolve(getWeekStart()),
  ]);

  const weeklyRows = await db.weeklyScore.findMany({
    where: { gameId: game.id, weekStart },
    select: { playerId: true, points: true },
    orderBy: { points: "desc" },
  });
  const weeklyRank = weeklyRows.findIndex((row) => row.playerId === playerId) + 1;
  const accuracy =
    stats && stats.totalPlayed > 0
      ? Math.round((stats.totalCorrect / stats.totalPlayed) * 100)
      : 0;

  return {
    player: {
      id: player.id,
      displayName: publicName(player.displayName),
      instagramHandle: player.instagramHandle,
      city: player.city,
      image: player.image,
      isGuest: player.isGuest,
      email: player.email,
      joinedAt: player.createdAt.toISOString(),
    },
    stats: {
      currentStreak: stats?.currentStreak ?? 0,
      bestStreak: stats?.bestStreak ?? 0,
      weeklyRank: weeklyRank || null,
      bestResponseMs: stats?.bestResponseMs ?? null,
      accuracy,
      played: stats?.totalPlayed ?? 0,
      correct: stats?.totalCorrect ?? 0,
      totalScore: stats?.totalScore ?? 0,
    },
    categories: categories.map((row) => ({
      name: row.category.name,
      slug: row.category.slug,
      played: row.played,
      correct: row.correct,
      accuracy: row.played ? Math.round((row.correct / row.played) * 100) : 0,
    })),
  };
}
