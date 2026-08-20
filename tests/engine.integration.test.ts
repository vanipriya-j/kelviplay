import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { openKelvi, submitKelvi } from "@/lib/game/engine";
import { DEFAULT_SCORING } from "@/lib/game/scoring";
import { isPostgresUrl } from "@/lib/db-url";

const url = process.env.DATABASE_URL?.trim() || "";
const postgres = Boolean(
  process.env.KELVI_INTEGRATION_DB && isPostgresUrl(url),
);

describe.skipIf(!postgres)("kelvi engine integration", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    db = new PrismaClient({ datasources: { db: { url } } });
    await seedMinimal(db);
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("keeps the original start time on refresh and blocks double scoring", async () => {
    const player = await db.player.create({
      data: { displayName: "Tester", isGuest: true },
    });
    const first = await openKelvi(db, { playerId: player.id });
    if (first.alreadySubmitted) throw new Error("unexpected");
    const startedAt = first.startedAt;
    const second = await openKelvi(db, { playerId: player.id });
    if (second.alreadySubmitted) throw new Error("unexpected");
    expect(second.startedAt).toBe(startedAt);

    const question = await db.question.findFirstOrThrow({
      where: { number: 184 },
    });
    const option = await db.questionOption.findFirstOrThrow({
      where: { questionId: question.id, isCorrect: true },
    });
    const submit1 = await submitKelvi(db, {
      playerId: player.id,
      questionId: question.id,
      answer: option.id,
    });
    const submit2 = await submitKelvi(db, {
      playerId: player.id,
      questionId: question.id,
      answer: option.id,
    });
    expect(submit1.alreadySubmitted).toBe(false);
    expect(submit2.alreadySubmitted).toBe(true);
    expect(submit2.attemptId).toBe(submit1.attemptId);

    const attempt = await db.attempt.findUniqueOrThrow({ where: { id: submit1.attemptId } });
    expect(attempt.score).toBeGreaterThan(0);
    expect(attempt.correct).toBe(true);

    const stats = await db.playerGameStats.findFirstOrThrow({ where: { playerId: player.id } });
    expect(stats.currentStreak).toBe(1);
    expect(stats.totalPlayed).toBe(1);
  });
});

async function seedMinimal(db: PrismaClient) {
  const game =
    (await db.game.findUnique({ where: { slug: "kelvi" } })) ??
    (await db.game.create({ data: { slug: "kelvi", name: "Kelvi" } }));
  const category =
    (await db.category.findUnique({ where: { slug: "chennai" } })) ??
    (await db.category.create({ data: { slug: "chennai", name: "Chennai" } }));
  const now = new Date();
  const existing = await db.question.findUnique({ where: { number: 184 } });
  if (!existing) {
    await db.question.create({
      data: {
        gameId: game.id,
        number: 184,
        internalTitle: "Live",
        questionText: "Which composer uses the Padmanabha mudra?",
        questionType: "MULTIPLE_CHOICE",
        categoryId: category.id,
        difficulty: "MEDIUM",
        correctAnswer: "Swathi Thirunal",
        acceptableAnswers: [],
        releaseAt: new Date(now.getTime() - 60_000),
        expireAt: new Date(now.getTime() + 60 * 60 * 1000),
        status: "SCHEDULED",
        scoringConfig: DEFAULT_SCORING as object,
        options: {
          create: [
            { text: "Swathi Thirunal", isCorrect: true, sortOrder: 0 },
            { text: "Tyagaraja", isCorrect: false, sortOrder: 1 },
          ],
        },
      },
    });
  }
  await db.achievement.upsert({
    where: { code: "FIRST_TOP_10" },
    update: {},
    create: { code: "FIRST_TOP_10", name: "FIRST TOP 10", description: "Top ten" },
  });
  await db.achievement.upsert({
    where: { code: "FASTEST_FINGERS" },
    update: {},
    create: { code: "FASTEST_FINGERS", name: "FASTEST FINGERS", description: "First" },
  });
}
