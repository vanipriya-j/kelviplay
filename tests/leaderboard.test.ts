import { describe, expect, it } from "vitest";
import { percentileFaster, rankFasterFingers, rankWeekly } from "@/lib/game/leaderboard";

describe("faster fingers", () => {
  it("orders correct answers by response time", () => {
    const ranked = rankFasterFingers(
      [
        { playerId: "meera", displayName: "Meera", responseMs: 2140 },
        { playerId: "you", displayName: "You", responseMs: 3840 },
        { playerId: "karthik", displayName: "Karthik", responseMs: 1920 },
      ],
      "you",
    );
    expect(ranked.map((row) => row.displayName)).toEqual(["Karthik", "Meera", "You"]);
    expect(ranked[2]).toMatchObject({ rank: 3, isYou: true });
  });

  it("computes percentile from rank", () => {
    expect(percentileFaster(1, 11)).toBe(100);
    expect(percentileFaster(2, 11)).toBe(90);
  });
});

describe("weekly leaderboard", () => {
  it("orders by points then correctness then speed", () => {
    const ranked = rankWeekly(
      [
        { playerId: "a", displayName: "Arun", points: 4760, attempted: 8, correct: 7, totalResponseMs: 21000 },
        { playerId: "m", displayName: "Meera", points: 4820, attempted: 8, correct: 8, totalResponseMs: 24000 },
        { playerId: "k", displayName: "Kavya", points: 4610, attempted: 8, correct: 7, totalResponseMs: 18000 },
      ],
      "k",
    );
    expect(ranked[0].displayName).toBe("Meera");
    expect(ranked[2].isYou).toBe(true);
  });
});
