import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  gradePractice,
  gradePracticeQuestion,
  isPracticeVisible,
  listPracticeQuestions,
  nextPracticeQuestionId,
} from "@/lib/game/practice";

const now = new Date("2026-11-24T06:00:00.000Z");

function windowAround(status: "past" | "live" | "future") {
  if (status === "past") {
    return {
      releaseAt: new Date("2026-11-23T00:00:00.000Z"),
      expireAt: new Date("2026-11-23T02:00:00.000Z"),
    };
  }
  if (status === "live") {
    return {
      releaseAt: new Date("2026-11-24T05:00:00.000Z"),
      expireAt: new Date("2026-11-24T07:00:00.000Z"),
    };
  }
  return {
    releaseAt: new Date("2026-11-25T00:00:00.000Z"),
    expireAt: new Date("2026-11-25T02:00:00.000Z"),
  };
}

describe("practice visibility", () => {
  it("lets anyone retry live and expired Kelvis", () => {
    expect(
      isPracticeVisible({ status: "SCHEDULED", ...windowAround("past") }, { includeUpcoming: false }, now),
    ).toBe(true);
    expect(
      isPracticeVisible({ status: "SCHEDULED", ...windowAround("live") }, { includeUpcoming: false }, now),
    ).toBe(true);
  });

  it("hides drafts, upcoming drops, and archives from public practice", () => {
    expect(
      isPracticeVisible({ status: "DRAFT", ...windowAround("future") }, { includeUpcoming: false }, now),
    ).toBe(false);
    expect(
      isPracticeVisible({ status: "SCHEDULED", ...windowAround("future") }, { includeUpcoming: false }, now),
    ).toBe(false);
    expect(
      isPracticeVisible({ status: "ARCHIVED", ...windowAround("past") }, { includeUpcoming: false }, now),
    ).toBe(false);
  });

  it("lets admins walk upcoming and draft questions", () => {
    expect(
      isPracticeVisible({ status: "DRAFT", ...windowAround("future") }, { includeUpcoming: true }, now),
    ).toBe(true);
    expect(
      isPracticeVisible({ status: "SCHEDULED", ...windowAround("future") }, { includeUpcoming: true }, now),
    ).toBe(true);
    expect(
      isPracticeVisible({ status: "ARCHIVED", ...windowAround("past") }, { includeUpcoming: true }, now),
    ).toBe(false);
  });
});

describe("practice walk", () => {
  it("advances to the next question in list order", () => {
    expect(nextPracticeQuestionId([{ id: "a" }, { id: "b" }, { id: "c" }], "a")).toBe("b");
    expect(nextPracticeQuestionId([{ id: "a" }, { id: "b" }, { id: "c" }], "c")).toBeNull();
    expect(nextPracticeQuestionId([{ id: "a" }], "missing")).toBeNull();
  });

  it("lists only the visible Kelvis, in number order", async () => {
    const db = {
      question: {
        findMany: async () => [
          {
            id: "190",
            number: 190,
            internalTitle: "Later",
            questionType: "TEXT",
            status: "SCHEDULED",
            ...windowAround("future"),
            category: { name: "Cinema" },
          },
          {
            id: "170",
            number: 170,
            internalTitle: "Kelvi",
            questionType: "MULTIPLE_CHOICE",
            status: "SCHEDULED",
            ...windowAround("past"),
            category: { name: "Tamil" },
          },
        ],
      },
    } as unknown as PrismaClient;

    const publicList = await listPracticeQuestions(db, { includeUpcoming: false }, now);
    expect(publicList.map((item) => item.number)).toEqual([170]);

    const adminList = await listPracticeQuestions(db, { includeUpcoming: true }, now);
    expect(adminList.map((item) => item.number)).toEqual([170, 190]);
  });
});

describe("practice grading", () => {
  it("grades without needing a live window or a timer", () => {
    const mc = gradePractice({
      questionType: "MULTIPLE_CHOICE",
      submitted: "opt-1",
      correctAnswer: "A question",
      acceptableAnswers: [],
      options: [
        { id: "opt-1", text: "A question", isCorrect: true },
        { id: "opt-2", text: "A harvest song", isCorrect: false },
      ],
    });
    expect(mc.correct).toBe(true);
    expect(mc.answer).toBe("A question");
    expect(mc.correctOptionId).toBe("opt-1");

    const text = gradePractice({
      questionType: "TEXT",
      submitted: "tiruvanmiyur",
      correctAnswer: "Thiruvanmiyur",
      acceptableAnswers: ["tiruvanmiyur"],
      options: [],
    });
    expect(text.correct).toBe(true);
    expect(text.correctOptionId).toBeNull();
  });

  it("returns null for questions outside this player's practice set", async () => {
    const db = {
      question: {
        findMany: async () => [
          {
            id: "170",
            number: 170,
            internalTitle: "Kelvi",
            questionType: "TEXT",
            status: "SCHEDULED",
            ...windowAround("future"),
            category: { name: "Tamil" },
          },
        ],
        findUnique: async () => null,
      },
    } as unknown as PrismaClient;

    const result = await gradePracticeQuestion(
      db,
      { questionId: "170", answer: "A question", visibility: { includeUpcoming: false } },
      now,
    );
    expect(result).toBeNull();
  });
});
