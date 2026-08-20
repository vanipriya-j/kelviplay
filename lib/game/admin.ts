import { prisma } from "@/lib/db";
import { getLiveQuestion } from "@/lib/game/engine";
import { computeQuestionStatus } from "@/lib/game/time";
import { KELVI_SLUG } from "@/lib/game/scoring";

export async function getAdminDashboard() {
  const now = new Date();
  const live = await getLiveQuestion(prisma, now);
  const game = await prisma.game.findUnique({ where: { slug: KELVI_SLUG } });
  const upcoming = await prisma.question.findMany({
    where: {
      game: { slug: KELVI_SLUG },
      status: { notIn: ["DRAFT", "ARCHIVED"] },
      releaseAt: { gt: now },
    },
    orderBy: { releaseAt: "asc" },
    take: 8,
    include: { category: true },
  });

  if (!live || !game) {
    return {
      live: null,
      playing: 0,
      submitted: 0,
      correctRate: null as number | null,
      avgResponseMs: null as number | null,
      fastestMs: null as number | null,
      upcoming,
    };
  }

  const [playing, attempts] = await Promise.all([
    prisma.livePresence.count({
      where: { questionId: live.id, lastSeenAt: { gte: new Date(now.getTime() - 60_000) } },
    }),
    prisma.attempt.findMany({
      where: { questionId: live.id, submittedAt: { not: null } },
      select: { correct: true, responseMs: true },
    }),
  ]);

  const submitted = attempts.length;
  const correct = attempts.filter((row) => row.correct).length;
  const times = attempts
    .filter((row) => row.correct && row.responseMs != null)
    .map((row) => row.responseMs!) as number[];

  return {
    live: {
      number: live.number,
      status: computeQuestionStatus(live, now),
      endsAt: live.expireAt.toISOString(),
    },
    playing,
    submitted,
    correctRate: submitted ? Math.round((correct / submitted) * 100) : null,
    avgResponseMs: times.length
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : null,
    fastestMs: times.length ? Math.min(...times) : null,
    upcoming,
  };
}

export { computeQuestionStatus };
