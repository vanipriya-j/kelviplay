"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { DEFAULT_SCORING, KELVI_SLUG } from "@/lib/game/scoring";
import { getWeekStart } from "@/lib/game/time";
import { randomVoucherCode } from "@/lib/utils";
import { z } from "zod";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}

const questionSchema = z.object({
  id: z.string().optional(),
  number: z.coerce.number().int().positive(),
  internalTitle: z.string().min(2),
  questionText: z.string().min(8),
  questionType: z.enum(["MULTIPLE_CHOICE", "TEXT", "IMAGE", "AUDIO"]),
  categoryId: z.string().min(1),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  correctAnswer: z.string().min(1),
  acceptableAnswers: z.string().optional(),
  options: z.string().optional(),
  releaseAt: z.string(),
  expireAt: z.string(),
  status: z.enum(["DRAFT", "SCHEDULED", "ARCHIVED"]),
  competitive: z.coerce.boolean().optional(),
  streakRule: z.enum(["consecutive_correct", "participation"]).optional(),
  scoringConfig: z.string().optional(),
});

function parseList(value?: string) {
  return (value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function saveQuestionAction(input: unknown) {
  await requireAdmin();
  const parsed = questionSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Check the question fields." };
  }
  const data = parsed.data;
  const game = await prisma.game.findUnique({ where: { slug: KELVI_SLUG } });
  if (!game) return { ok: false as const, error: "Kelvi game missing." };

  const acceptableAnswers = parseList(data.acceptableAnswers);
  const optionLines = parseList(data.options);
  let scoringConfig: object = DEFAULT_SCORING;
  if (data.scoringConfig?.trim()) {
    try {
      scoringConfig = JSON.parse(data.scoringConfig) as object;
    } catch {
      return { ok: false as const, error: "Scoring JSON is invalid." };
    }
  }

  const payload = {
    gameId: game.id,
    number: data.number,
    internalTitle: data.internalTitle,
    questionText: data.questionText,
    questionType: data.questionType,
    categoryId: data.categoryId,
    difficulty: data.difficulty,
    correctAnswer: data.correctAnswer,
    acceptableAnswers,
    releaseAt: new Date(data.releaseAt),
    expireAt: new Date(data.expireAt),
    status: data.status,
    competitive: data.competitive ?? true,
    streakRule: data.streakRule ?? "consecutive_correct",
    scoringConfig,
  };

  const question = data.id
    ? await prisma.question.update({ where: { id: data.id }, data: payload })
    : await prisma.question.create({ data: payload });

  if (data.questionType === "MULTIPLE_CHOICE") {
    await prisma.questionOption.deleteMany({ where: { questionId: question.id } });
    await prisma.questionOption.createMany({
      data: optionLines.map((line, index) => {
        const isCorrect = line.startsWith("*") || line.startsWith("✓");
        const text = line.replace(/^(\*|✓)\s*/, "");
        return {
          questionId: question.id,
          text,
          isCorrect: isCorrect || text === data.correctAnswer,
          sortOrder: index,
        };
      }),
    });
  }

  revalidatePath("/admin/kelvi/questions");
  revalidatePath("/play/kelvi");
  return { ok: true as const, id: question.id };
}

export async function deleteQuestionAction(id: string) {
  await requireAdmin();
  const attempts = await prisma.attempt.count({ where: { questionId: id } });
  if (attempts > 0) {
    await prisma.question.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
  } else {
    await prisma.questionOption.deleteMany({ where: { questionId: id } });
    await prisma.question.delete({ where: { id } });
  }
  revalidatePath("/admin/kelvi/questions");
  return { ok: true as const };
}

export async function saveCategoryAction(name: string) {
  await requireAdmin();
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  await prisma.category.upsert({
    where: { slug },
    update: { name },
    create: { slug, name },
  });
  revalidatePath("/admin/kelvi/questions");
  return { ok: true as const };
}

const rewardSchema = z.object({
  type: z.enum(["WEEKLY_CHAMPION", "FASTER_FINGERS", "STREAK_DRAW"]),
  playerId: z.string().optional(),
  voucherAmount: z.coerce.number().int().positive(),
  weekStart: z.string().optional(),
});

export async function assignRewardAction(input: unknown) {
  await requireAdmin();
  const parsed = rewardSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Invalid reward." };

  const weekStart = parsed.data.weekStart
    ? new Date(parsed.data.weekStart)
    : getWeekStart();
  const game = await prisma.game.findUnique({ where: { slug: KELVI_SLUG } });
  if (!game) return { ok: false as const, error: "Kelvi missing." };

  let playerId = parsed.data.playerId || null;
  if (!playerId) {
    if (parsed.data.type === "WEEKLY_CHAMPION") {
      const top = await prisma.weeklyScore.findFirst({
        where: { gameId: game.id, weekStart },
        orderBy: [{ points: "desc" }, { correct: "desc" }],
      });
      playerId = top?.playerId ?? null;
    } else if (parsed.data.type === "FASTER_FINGERS") {
      const rows = await prisma.weeklyScore.findMany({
        where: { gameId: game.id, weekStart, correct: { gte: 3 } },
      });
      rows.sort((a, b) => {
        const aAvg = a.correct ? a.totalResponseMs / a.correct : Infinity;
        const bAvg = b.correct ? b.totalResponseMs / b.correct : Infinity;
        return aAvg - bAvg;
      });
      playerId = rows[0]?.playerId ?? null;
    } else {
      const eligible = await prisma.playerGameStats.findMany({
        where: { gameId: game.id, currentStreak: { gte: 7 } },
        select: { playerId: true },
      });
      if (eligible.length) {
        playerId = eligible[Math.floor(Math.random() * eligible.length)].playerId;
      }
    }
  }

  if (!playerId) return { ok: false as const, error: "No eligible player." };

  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + 90 * 24 * 60 * 60 * 1000);
  await prisma.reward.upsert({
    where: {
      weekStart_type: { weekStart, type: parsed.data.type },
    },
    update: {
      playerId,
      voucherAmount: parsed.data.voucherAmount,
      voucherCode: randomVoucherCode(),
      issuedAt,
      expiresAt,
      redeemedAt: null,
    },
    create: {
      weekStart,
      type: parsed.data.type,
      playerId,
      voucherAmount: parsed.data.voucherAmount,
      voucherCode: randomVoucherCode(),
      issuedAt,
      expiresAt,
    },
  });
  revalidatePath("/admin/kelvi/rewards");
  return { ok: true as const };
}

export async function markRewardRedeemedAction(id: string, redeemed: boolean) {
  await requireAdmin();
  await prisma.reward.update({
    where: { id },
    data: { redeemedAt: redeemed ? new Date() : null },
  });
  revalidatePath("/admin/kelvi/rewards");
  return { ok: true as const };
}
