import type { PrismaClient } from "@prisma/client";
import { publicName } from "../utils";
import { KELVI_SLUG } from "./scoring";
import { formatResponseSeconds, istDayKey } from "./time";

export type DailyWinnerRow = {
  playerId: string;
  displayName: string;
  points: number;
  correct: number;
  attempted: number;
  bestResponseMs: number | null;
};

export type DailyFastest = {
  playerId: string;
  displayName: string;
  responseMs: number;
  seconds: string;
};

export type DailyPodiumPlace = {
  rank: number;
  playerId: string;
  displayName: string;
  points: number;
  correct: number;
  attempted: number;
  bestSeconds: string | null;
  isYou?: boolean;
};

export function rankDailyWinners(rows: DailyWinnerRow[]): DailyWinnerRow[] {
  return [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    const aMs = a.bestResponseMs ?? Number.MAX_SAFE_INTEGER;
    const bMs = b.bestResponseMs ?? Number.MAX_SAFE_INTEGER;
    return aMs - bMs;
  });
}

export function pickDailyFastest(
  attempts: Array<{ playerId: string; displayName: string; responseMs: number | null }>,
): DailyFastest | null {
  const ranked = attempts
    .filter((row) => row.responseMs != null)
    .sort((a, b) => (a.responseMs ?? 0) - (b.responseMs ?? 0));
  const first = ranked[0];
  if (!first || first.responseMs == null) return null;
  return {
    playerId: first.playerId,
    displayName: publicName(first.displayName),
    responseMs: first.responseMs,
    seconds: formatResponseSeconds(first.responseMs),
  };
}

export async function getDailyWinners(
  db: PrismaClient,
  dayStart: Date,
  playerId?: string | null,
) {
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
  const attempts = await db.attempt.findMany({
    where: {
      submittedAt: { not: null },
      question: {
        game: { slug: KELVI_SLUG },
        releaseAt: { gte: dayStart, lt: dayEnd },
        status: { notIn: ["DRAFT", "ARCHIVED"] },
      },
    },
    select: {
      playerId: true,
      correct: true,
      score: true,
      responseMs: true,
      player: { select: { displayName: true } },
    },
  });

  const byPlayer = new Map<string, DailyWinnerRow & { rawName: string }>();
  const correctAttempts: Array<{ playerId: string; displayName: string; responseMs: number | null }> =
    [];

  for (const attempt of attempts) {
    const current = byPlayer.get(attempt.playerId) ?? {
      playerId: attempt.playerId,
      displayName: publicName(attempt.player.displayName),
      rawName: attempt.player.displayName,
      points: 0,
      correct: 0,
      attempted: 0,
      bestResponseMs: null as number | null,
    };
    current.attempted += 1;
    if (attempt.correct) {
      current.correct += 1;
      current.points += attempt.score;
      if (
        attempt.responseMs != null &&
        (current.bestResponseMs == null || attempt.responseMs < current.bestResponseMs)
      ) {
        current.bestResponseMs = attempt.responseMs;
      }
      correctAttempts.push({
        playerId: attempt.playerId,
        displayName: attempt.player.displayName,
        responseMs: attempt.responseMs,
      });
    }
    byPlayer.set(attempt.playerId, current);
  }

  const ranked = rankDailyWinners([...byPlayer.values()]).filter((row) => row.correct > 0);
  const podium: DailyPodiumPlace[] = ranked.slice(0, 3).map((row, index) => ({
    rank: index + 1,
    playerId: row.playerId,
    displayName: row.displayName,
    points: row.points,
    correct: row.correct,
    attempted: row.attempted,
    bestSeconds: row.bestResponseMs != null ? formatResponseSeconds(row.bestResponseMs) : null,
    isYou: playerId ? row.playerId === playerId : false,
  }));

  return {
    dayStart,
    dayKey: istDayKey(dayStart),
    played: attempts.length,
    podium,
    fastest: pickDailyFastest(correctAttempts),
  };
}
