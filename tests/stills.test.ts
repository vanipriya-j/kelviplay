import { describe, expect, it } from "vitest";
import {
  answerStillFile,
  legacyStillFile,
  matchStillName,
  questionStillFile,
  stillCandidates,
  stillPath,
} from "@/lib/catalog/stills";

describe("Drive stills in play", () => {
  it("names GPT movie-poster files for the question and the answer", () => {
    expect(questionStillFile(170)).toBe("kelvi-0170-question.png");
    expect(answerStillFile(170)).toBe("kelvi-0170-answer.png");
    expect(legacyStillFile(7)).toBe("kelvi-0007.png");
  });

  it("looks for the split still first, then the older single poster", () => {
    expect(stillCandidates(170, "question")).toEqual([
      "kelvi-0170-question.png",
      "kelvi-0170.png",
    ]);
    expect(stillCandidates(170, "answer")).toEqual(["kelvi-0170-answer.png"]);
  });

  it("serves stills through the play proxy so Drive can stay private", () => {
    expect(stillPath(170, "question")).toBe("/api/kelvi/still?number=170&side=question");
    expect(stillPath(171, "answer")).toBe("/api/kelvi/still?number=171&side=answer");
  });

  it("matches GPT filenames even when the suffix is not exact", () => {
    expect(matchStillName("kelvi-0170-question.png", 170, "question")).toBe(true);
    expect(matchStillName("Kelvi_0170_Question.JPG", 170, "question")).toBe(true);
    expect(matchStillName("kelvi-170-answer.png", 170, "answer")).toBe(true);
    expect(matchStillName("kelvi-0170-question.png", 170, "answer")).toBe(false);
    expect(matchStillName("kelvi-0171-question.png", 170, "question")).toBe(false);
  });
});
