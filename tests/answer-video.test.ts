import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { answerVideoKey, getAnswerVideo } from "@/lib/game/answer-video";
import { getPracticeQuestion, gradePracticeQuestion } from "@/lib/game/practice";

describe("Badhil video", () => {
  it("reads the matching question's configured URL and ignores other value types", async () => {
    const findUnique = vi.fn().mockResolvedValueOnce({ value: "https://example.com/reveal.mp4" })
      .mockResolvedValueOnce({ value: { legacy: true } });
    const db = { appConfig: { findUnique } } as unknown as PrismaClient;
    await expect(getAnswerVideo(db, "q1")).resolves.toBe("https://example.com/reveal.mp4");
    expect(findUnique).toHaveBeenCalledWith({
      where: { key: answerVideoKey("q1") },
      select: { value: true },
    });
    await expect(getAnswerVideo(db, "q2")).resolves.toBeNull();
  });

  it("includes the Kelvi video on open and the Badhil video only in the grade", async () => {
    const reveal = "https://example.com/reveal.mp4";
    const db = {
      question: {
        findUnique: vi.fn().mockResolvedValue({
          id: "q1", number: 170, internalTitle: "Question", questionText: "What is this?",
          questionType: "TEXT", status: "EXPIRED", correctAnswer: "Kelvi",
          acceptableAnswers: [], category: { name: "Tamil" }, options: [],
          mediaKind: "video", mediaUrl: "https://example.com/prompt.mp4",
        }),
        findFirst: vi.fn().mockResolvedValue(null),
      },
      appConfig: { findUnique: vi.fn().mockResolvedValue({ value: reveal }) },
    } as unknown as PrismaClient;
    const visibility = { includeUpcoming: false };
    const opened = await getPracticeQuestion(db, "q1", visibility);
    expect(opened?.question).toMatchObject({ mediaKind: "video", mediaUrl: "https://example.com/prompt.mp4" });
    expect(JSON.stringify(opened)).not.toContain(reveal);
    expect(db.appConfig.findUnique).not.toHaveBeenCalled();
    await expect(gradePracticeQuestion(db, { questionId: "q1", answer: "Kelvi", visibility }))
      .resolves.toMatchObject({ correct: true, answerVideoUrl: reveal });
  });
});
