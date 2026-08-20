import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { openKelvi, submitKelvi } from "@/lib/game/engine";
import { DEFAULT_SCORING } from "@/lib/game/scoring";

const dbPath = path.join(process.cwd(), "prisma", "test.db");
const url = `file:${dbPath}`;

describe("kelvi engine integration", () => {
  let db: PrismaClient;

  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    execSync("npx prisma db push --skip-generate", {
      env: { ...process.env, DATABASE_URL: url },
      stdio: "pipe",
    });
    db = new PrismaClient({ datasources: { db: { url } } });
    await seedMinimal(db);
  });

  afterAll(async () => {
    await db.$disconnect();
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
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

    const question = await db.question.findFirstOrThrow();
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
  const game = await db.game.create({ data: { slug: "kelvi", name: "Kelvi" } });
  const category = await db.category.create({ data: { slug: "chennai", name: "Chennai" } });
  const now = new Date();
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
  await db.achievement.create({
    data: { code: "FIRST_TOP_10", name: "FIRST TOP 10", description: "Top ten" },
  });
  await db.achievement.create({
    data: { code: "FASTEST_FINGERS", name: "FASTEST FINGERS", description: "First" },
  });
}
