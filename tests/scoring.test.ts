import { describe, expect, it } from "vitest";
import { computeScore, DEFAULT_SCORING, hitMilestones, nextStreak } from "@/lib/game/scoring";

describe("scoring", () => {
  it("awards speed bands on a correct answer", () => {
    expect(computeScore({ correct: true, responseMs: 1920 }).score).toBe(150);
    expect(computeScore({ correct: true, responseMs: 3840 }).score).toBe(140);
    expect(computeScore({ correct: true, responseMs: 7200 }).score).toBe(130);
    expect(computeScore({ correct: true, responseMs: 15000 }).score).toBe(120);
    expect(computeScore({ correct: true, responseMs: 25000 }).score).toBe(110);
    expect(computeScore({ correct: true, responseMs: 40000 }).score).toBe(100);
  });

  it("scores a wrong answer as zero by default", () => {
    expect(computeScore({ correct: false, responseMs: 800 }).score).toBe(0);
  });

  it("does not hard-code the formula beyond config", () => {
    const custom = {
      ...DEFAULT_SCORING,
      baseCorrectScore: 80,
      speedBonuses: [{ maxMs: null, bonus: 5 }],
    };
    expect(computeScore({ correct: true, responseMs: 900, scoring: custom }).score).toBe(85);
  });
});

describe("streaks", () => {
  it("uses consecutive correct answers by default", () => {
    expect(nextStreak(14, true)).toBe(15);
    expect(nextStreak(14, false)).toBe(0);
  });

  it("can treat streak as participation when configured", () => {
    expect(nextStreak(4, false, "participation")).toBe(5);
  });

  it("emits milestone events", () => {
    expect(hitMilestones(6, 7)).toEqual([7]);
    expect(hitMilestones(14, 15)).toEqual([15]);
    expect(hitMilestones(2, 2)).toEqual([]);
  });
});
