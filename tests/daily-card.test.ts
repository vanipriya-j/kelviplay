import { describe, expect, it } from "vitest";
import { assertNoSpoilers } from "@/lib/share/payload";
import { buildDailyWinnersCard, dailyWinnersCaption } from "@/lib/share/daily-card";

describe("daily winners card", () => {
  const card = buildDailyWinnersCard({
    dayKey: "2026-09-16",
    dayStart: new Date("2026-09-15T18:30:00.000Z"),
    podium: [
      {
        rank: 1,
        playerId: "m",
        displayName: "Meera",
        points: 820,
        correct: 6,
        attempted: 6,
        bestSeconds: "1.92",
      },
      {
        rank: 2,
        playerId: "k",
        displayName: "Karthik",
        points: 760,
        correct: 6,
        attempted: 7,
        bestSeconds: "2.40",
      },
    ],
    fastest: {
      playerId: "m",
      displayName: "Meera",
      responseMs: 1920,
      seconds: "1.92",
    },
  });

  it("never includes question or answer fields", () => {
    expect(card.headline).toBe("TODAY'S WINNERS");
    expect(card.podium[0].displayName).toBe("MEERA");
    expect(card.handles).toEqual(["@aarla.play", "@aarla.kanakangi", "@aarla.merch"]);
    expect(() => assertNoSpoilers(card)).not.toThrow();
    const json = JSON.stringify(card).toLowerCase();
    expect(json).not.toContain("questiontext");
    expect(json).not.toContain("correctanswer");
  });

  it("builds an Instagram caption without spoilers", () => {
    const caption = dailyWinnersCaption(card);
    expect(caption).toContain("Today's winners");
    expect(caption).toContain("MEERA");
    expect(caption).toContain("@aarla.play");
    expect(caption.toLowerCase()).not.toContain("questiontext");
    expect(caption.toLowerCase()).not.toContain("correctanswer");
  });
});
