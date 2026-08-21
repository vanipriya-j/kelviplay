import type { PrismaClient } from "@prisma/client";
import { rankFasterFingers, rankWeekly } from "./leaderboard";
import { nextMilestone, PRESENCE_TTL_MS } from "./scoring";
import { formatWindowLabel, getDayStart, getWeekStart } from "./time";
import { countPlaying, getKelviGame, getLiveHeadline, getNextQuestion } from "./engine";
import { publicName } from "../utils";

function emptyHome() {
  return {
    player: null,
    live: null,
    next: null,
    stats: {
      currentStreak: 0,
      bestStreak: 0,
      weeklyRank: null as number | null,
      weeklyPoints: 0,
      nextMilestone: 3 as number | null,
      todayCompleted: 0,
      todayTotal: 0,
    },
    weeklyPreview: [] as ReturnType<typeof rankWeekly>,
    youWeekly: null as ReturnType<typeof rankWeekly>[number] | null,
    recentAchievements: [] as { code: string; name: string; earnedAt: string }[],
    presenceTtlMs: PRESENCE_TTL_MS,
    setupNeeded: true,
  };
}

export async function getHomeState(db: PrismaClient, playerId?: string | null) {
  try {
    const now = new Date();
    const [live, next, game, player] = await Promise.all([
      getLiveHeadline(db, now),
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

    const weekStart = getWeekStart(now);
    const dayStart = getDayStart(now);
    const [stats, weeklyRows, todayCompleted, todayScheduled, recentAchievements, attempt, playingCount] =
      await Promise.all([
        playerId
          ? db.playerGameStats.findUnique({
              where: { playerId_gameId: { playerId, gameId: game.id } },
            })
          : null,
        db.weeklyScore.findMany({
          where: { gameId: game.id, weekStart },
          include: { player: { select: { id: true, displayName: true } } },
        }),
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
        live ? countPlaying(db, live.id, now) : 0,
      ]);

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
    setupNeeded: false,
  };
  } catch (error) {
    console.error("[kelvi] home state failed", error);
    return emptyHome();
  }
}

export async function getLeaderboardState(db: PrismaClient, playerId?: string | null) {
  try {
  const now = new Date();
  const [live, game] = await Promise.all([getLiveHeadline(db, now), getKelviGame(db)]);
  const weekStart = getWeekStart(now);

  const [weeklyRows, liveAttempts, stats] = await Promise.all([
    db.weeklyScore.findMany({
      where: { gameId: game.id, weekStart },
      include: { player: { select: { id: true, displayName: true } } },
    }),
    live
      ? db.attempt.findMany({
          where: {
            questionId: live.id,
            correct: true,
            submittedAt: { not: null },
            responseMs: { not: null },
          },
          include: { player: { select: { id: true, displayName: true } } },
        })
      : [],
    playerId
      ? db.playerGameStats.findUnique({
          where: { playerId_gameId: { playerId, gameId: game.id } },
        })
      : null,
  ]);

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

  let fasterFingers: ReturnType<typeof rankFasterFingers> = [];
  let liveNumber: number | null = null;
  if (live) {
    liveNumber = live.number;
    const ranked = rankFasterFingers(
      liveAttempts.map((row) => ({
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
  } catch (error) {
    console.error("[kelvi] leaderboard failed", error);
    return {
      liveNumber: null,
      fasterFingers: [],
      weekly: [],
      weeklyTotal: 0,
      youWeekly: null,
      you: null,
    };
  }
}

export async function getProfileState(db: PrismaClient, playerId: string) {
  try {
  const player = await db.player.findUnique({ where: { id: playerId } });
  if (!player) return null;
  let game: { id: string } | null = null;
  try {
    game = await getKelviGame(db);
  } catch {
    game = null;
  }
  if (!game) {
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
        currentStreak: 0,
        bestStreak: 0,
        weeklyRank: null,
        bestResponseMs: null,
        accuracy: 0,
        played: 0,
        correct: 0,
        totalScore: 0,
      },
      categories: [],
    };
  }

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
  } catch (error) {
    console.error("[kelvi] profile state failed", error);
    return null;
  }
}
