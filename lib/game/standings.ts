import type { Prisma, PrismaClient } from "@prisma/client";
import { publicName } from "../utils";
import { rankWeekly } from "./leaderboard";
import { KELVI_SLUG } from "./scoring";
import { getDayStart, getWeekStart, zonedDateTimeToUtc, zonedParts } from "./time";

export const LEADERBOARD_PERIODS = ["day", "week", "month", "all"] as const;
export type LeaderboardPeriod = (typeof LEADERBOARD_PERIODS)[number];
const DAY_MS = 86_400_000;

export function standingsWindows(period: LeaderboardPeriod, now: Date) {
  if (period === "all") return { current: {}, previous: null };
  const day = getDayStart(now);
  const { year, month } = zonedParts(now);
  const monthStart = (offset: number) => zonedDateTimeToUtc({ year, month: month + offset, day: 1 });
  const start = period === "week" ? getWeekStart(now) : period === "month" ? monthStart(0) : day;
  const duration = (period === "week" ? 7 : 1) * DAY_MS;
  const previous = period === "month" ? monthStart(-1) : new Date(start.getTime() - duration);
  const end = period === "month" ? monthStart(1) : new Date(start.getTime() + duration);
  return { current: { start, end }, previous: { start: previous, end: start } };
}

export function scoredAttempts(window: { start?: Date; end?: Date }): Prisma.AttemptWhereInput {
  return {
    responseMs: { not: null },
    submittedAt: { not: null, ...(window.end ? { lt: window.end } : {}) },
    question: {
      game: { slug: KELVI_SLUG },
      ...(window.start && window.end ? { releaseAt: { gte: window.start, lt: window.end } } : {}),
    },
  };
}

export async function getPeriodStandings(
  db: PrismaClient,
  window: { start?: Date; end?: Date },
  playerId?: string | null,
) {
  const groups = await db.attempt.groupBy({
    by: ["playerId", "correct"],
    where: scoredAttempts(window),
    _count: { _all: true },
    _sum: { score: true, responseMs: true },
  });
  const totals = new Map<string, {
    playerId: string; displayName: string; points: number; attempted: number; correct: number; totalResponseMs: number;
  }>();
  for (const group of groups) {
    const row = totals.get(group.playerId) ?? {
      playerId: group.playerId, displayName: "", points: 0, attempted: 0, correct: 0, totalResponseMs: 0,
    };
    row.attempted += group._count._all;
    row.points += group._sum.score ?? 0;
    if (group.correct) {
      row.correct += group._count._all;
      row.totalResponseMs += group._sum.responseMs ?? 0;
    }
    totals.set(group.playerId, row);
  }
  if (!totals.size) return [];
  const players = await db.player.findMany({
    where: { id: { in: [...totals.keys()] } },
    select: { id: true, displayName: true },
  });
  for (const player of players) {
    const row = totals.get(player.id);
    if (row) row.displayName = publicName(player.displayName);
  }
  return rankWeekly([...totals.values()], playerId);
}

export async function getCategoryChampions(db: PrismaClient, window: { start: Date; end: Date }, playerId?: string | null) {
  const rows = await db.$queryRaw<{
    category: string; slug: string; playerId: string; displayName: string; points: number; correct: number;
  }[]>`
    WITH scores AS (
      SELECT q."categoryId", a."playerId", sum(a.score)::int AS points,
             count(*) FILTER (WHERE a.correct)::int AS correct,
             avg(a."responseMs") FILTER (WHERE a.correct) AS speed
      FROM "kelvi"."Attempt" a
      JOIN "kelvi"."Question" q ON q.id = a."questionId"
      JOIN "kelvi"."Game" g ON g.id = q."gameId"
      WHERE g.slug = ${KELVI_SLUG}
        AND q."releaseAt" >= ${window.start} AND q."releaseAt" < ${window.end}
        AND a."submittedAt" < ${window.end} AND a."responseMs" IS NOT NULL
      GROUP BY q."categoryId", a."playerId"
      HAVING count(*) FILTER (WHERE a.correct) >= 3
    ), champions AS (
      SELECT DISTINCT ON ("categoryId") *
      FROM scores
      ORDER BY "categoryId", points DESC, correct DESC, speed ASC, "playerId" ASC
    )
    SELECT c.name AS category, c.slug, ch."playerId", p."displayName", ch.points, ch.correct
    FROM champions ch
    JOIN "kelvi"."Category" c ON c.id = ch."categoryId"
    JOIN "kelvi"."Player" p ON p.id = ch."playerId"
    ORDER BY c.name
  `;
  return rows.map((row) => ({ ...row, displayName: publicName(row.displayName), isYou: row.playerId === playerId }));
}
