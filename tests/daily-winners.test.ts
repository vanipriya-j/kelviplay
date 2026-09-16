import { describe, expect, it } from "vitest";
import { pickDailyFastest, rankDailyWinners } from "@/lib/game/daily-winners";

describe("daily winners", () => {
  it("ranks by points, then correct, then fastest", () => {
    const ranked = rankDailyWinners([
      {
        playerId: "a",
        displayName: "Arun",
        points: 400,
        correct: 4,
        attempted: 5,
        bestResponseMs: 1200,
      },
      {
        playerId: "m",
        displayName: "Meera",
        points: 420,
        correct: 3,
        attempted: 3,
        bestResponseMs: 4000,
      },
      {
        playerId: "k",
        displayName: "Kavya",
        points: 400,
        correct: 4,
        attempted: 4,
        bestResponseMs: 900,
      },
    ]);
    expect(ranked.map((row) => row.displayName)).toEqual(["Meera", "Kavya", "Arun"]);
  });

  it("picks the fastest correct attempt", () => {
    const fastest = pickDailyFastest([
      { playerId: "m", displayName: "Meera", responseMs: 2140 },
      { playerId: "k", displayName: "Karthik", responseMs: 1920 },
      { playerId: "a", displayName: "Arun", responseMs: null },
    ]);
    expect(fastest).toMatchObject({ displayName: "Karthik", responseMs: 1920, seconds: "1.92" });
  });
});
