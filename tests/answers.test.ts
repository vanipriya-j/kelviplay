import { describe, expect, it } from "vitest";
import { gradeAnswer, normalizeAnswer } from "@/lib/game/answers";

describe("answers", () => {
  it("normalizes casing and punctuation", () => {
    expect(normalizeAnswer("  Thiruvanmiyur! ")).toBe("thiruvanmiyur");
  });

  it("grades multiple choice by option id", () => {
    const options = [
      { id: "a", text: "Swathi Thirunal", isCorrect: true },
      { id: "b", text: "Tyagaraja", isCorrect: false },
    ];
    expect(
      gradeAnswer({
        questionType: "MULTIPLE_CHOICE",
        submitted: "a",
        correctAnswer: "Swathi Thirunal",
        acceptableAnswers: [],
        options,
      }),
    ).toBe(true);
    expect(
      gradeAnswer({
        questionType: "MULTIPLE_CHOICE",
        submitted: "b",
        correctAnswer: "Swathi Thirunal",
        acceptableAnswers: [],
        options,
      }),
    ).toBe(false);
  });

  it("grades text answers against variants", () => {
    expect(
      gradeAnswer({
        questionType: "TEXT",
        submitted: "Tiruvanmiyur",
        correctAnswer: "Thiruvanmiyur",
        acceptableAnswers: ["tiruvanmiyur"],
        options: [],
      }),
    ).toBe(true);
  });
});
