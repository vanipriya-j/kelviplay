import type { PrismaClient } from "@prisma/client";
import { dailyWinnersImagePath } from "./broadcast";
import { getDailyWinners } from "./daily-winners";
import { rankFasterFingers, type rankWeekly } from "./leaderboard";
import { cadenceCopy, formatIstDayLabel, nextDropWindow, winnersBoardDay } from "./rhythm";
import { getCategoryChampions, getPeriodStandings, standingsWindows, type LeaderboardPeriod } from "./standings";
import { nextMilestone, parseScoringConfig, PRESENCE_TTL_MS } from "./scoring";
import { formatWindowLabel, getDayStart, istDayKey, zonedParts } from "./time";
import { countPlaying, getKelviGame, getLiveHeadline, getNextQuestion } from "./engine";
import { publicName } from "../utils";

type HomeWinners = {
  dayKey: string;
  dayLabel: string;
  imageUrl: string;
  played: number;
  podium: Awaited<ReturnType<typeof getDailyWinners>>["podium"];
  fastest: Awaited<ReturnType<typeof getDailyWinners>>["fastest"];
};

function rhythmNextState(now = new Date()) {
  const window = nextDropWindow(now);
  return {
    number: null as number | null,
    windowLabel: formatWindowLabel(window.releaseAt, window.expireAt),
    releaseAt: window.releaseAt.toISOString(),
  };
}

function podiumAnnouncements(now: Date) {
  const { weekday, day } = zonedParts(now);
  return { weekly: weekday === "Sun", monthly: day === 1 };
}

function winnersShell(now = new Date()): HomeWinners | null {
  const boardDay = winnersBoardDay(now);
  if (!boardDay) return null;
  const dayKey = istDayKey(boardDay);
  return {
    dayKey,
    dayLabel: formatIstDayLabel(boardDay),
    imageUrl: dailyWinnersImagePath(dayKey),
    played: 0,
    podium: [],
    fastest: null,
  };
}

function emptyHome() {
  return {
    player: null,
    live: null,
    next: rhythmNextState(),
    cadence: cadenceCopy(),
    winners: winnersShell(),
    podiumAnnouncements: podiumAnnouncements(new Date()),
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

    const dayStart = getDayStart(now);
    const boardDay = winnersBoardDay(now);
    const rhythmNext = nextDropWindow(now);
    const [stats, weeklyRows, todayCompleted, todayScheduled, recentAchievements, attempt, playingCount, dailyWinners] =
      await Promise.all([
        playerId
          ? db.playerGameStats.findUnique({
              where: { playerId_gameId: { playerId, gameId: game.id } },
            })
          : null,
        getPeriodStandings(db, standingsWindows("week", now).current, playerId),
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
        boardDay ? getDailyWinners(db, boardDay, playerId).catch(() => null) : null,
      ]);

    const weekly = weeklyRows;
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
    cadence: cadenceCopy(),
    podiumAnnouncements: podiumAnnouncements(now),
    winners: dailyWinners && boardDay
      ? {
          dayKey: dailyWinners.dayKey,
          dayLabel: formatIstDayLabel(boardDay),
          imageUrl: dailyWinnersImagePath(dailyWinners.dayKey),
          played: dailyWinners.played,
          podium: dailyWinners.podium,
          fastest: dailyWinners.fastest,
        }
      : null,
    next: next
      ? {
          number: next.number,
          windowLabel: formatWindowLabel(next.releaseAt, next.expireAt),
          releaseAt: next.releaseAt.toISOString(),
        }
      : {
          number: null,
          windowLabel: formatWindowLabel(rhythmNext.releaseAt, rhythmNext.expireAt),
          releaseAt: rhythmNext.releaseAt.toISOString(),
        },
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

export async function getLeaderboardState(
  db: PrismaClient,
  playerId?: string | null,
  period: LeaderboardPeriod = "week",
  now = new Date(),
) {
  const windows = standingsWindows(period, now);
  const empty = {
    liveNumber: null as number | null,
    fasterFingers: [] as ReturnType<typeof rankFasterFingers>,
    rows: [] as Awaited<ReturnType<typeof getPeriodStandings>>,
    podium: [] as Awaited<ReturnType<typeof getPeriodStandings>>,
    you: null as Awaited<ReturnType<typeof getPeriodStandings>>[number] | null,
    windows,
    scoring: parseScoringConfig(null),
    categoryChampions: [] as Awaited<ReturnType<typeof getCategoryChampions>>,
    unavailable: false,
  };

  try {
    const [live, rows, podium, categoryChampions] = await Promise.all([
      getLiveHeadline(db, now),
      getPeriodStandings(db, windows.current, playerId),
      windows.previous
        ? period === "day"
          ? getDailyWinners(db, windows.previous.start, playerId).then(({ podium }) =>
              podium.map((row) => ({ ...row, isYou: Boolean(row.isYou), avgResponseMs: null })),
            )
          : getPeriodStandings(db, windows.previous, playerId).then((rows) =>
              rows.filter((row) => row.correct > 0).slice(0, 3),
            )
        : [],
      period === "week" && windows.previous
        ? getCategoryChampions(db, windows.previous, playerId)
        : [],
    ]);
    const scoring = live
      ? await db.question.findUnique({ where: { id: live.id }, select: { scoringConfig: true } })
      : null;
    const liveAttempts = live
      ? await db.attempt.findMany({
          where: { questionId: live.id, correct: true, responseMs: { not: null }, submittedAt: { not: null } },
          orderBy: [{ responseMs: "asc" }, { playerId: "asc" }],
          take: 10,
          select: { playerId: true, responseMs: true, player: { select: { displayName: true } } },
        })
      : [];

    return {
      ...empty,
      liveNumber: live?.number ?? null,
      fasterFingers: rankFasterFingers(liveAttempts.map((row) => ({
        playerId: row.playerId,
        displayName: publicName(row.player.displayName),
        responseMs: row.responseMs!,
      })), playerId),
      rows: rows.slice(0, 25),
      podium,
      categoryChampions,
      you: rows.find((row) => row.isYou) ?? null,
      scoring: parseScoringConfig(scoring?.scoringConfig),
    };
  } catch (error) {
    console.error("[kelvi] leaderboard failed", error);
    return { ...empty, unavailable: true };
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

  const [stats, categories, weeklyRows] = await Promise.all([
    db.playerGameStats.findUnique({
      where: { playerId_gameId: { playerId, gameId: game.id } },
    }),
    db.playerCategoryStats.findMany({
      where: { playerId },
      include: { category: true },
      orderBy: { played: "desc" },
    }),
    getPeriodStandings(db, standingsWindows("week", new Date()).current, playerId),
  ]);

  const weeklyRank = weeklyRows.find((row) => row.isYou)?.rank ?? null;
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
