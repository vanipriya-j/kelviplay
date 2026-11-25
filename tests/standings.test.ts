import { describe, expect, it } from "vitest";
import { categoryBadgeProgress } from "@/lib/game/achievements";
import { scoredAttempts, standingsWindows } from "@/lib/game/standings";

describe("IST leaderboard boundaries", () => {
  it("rolls over daily at midnight and retains the just-completed day", () => {
    const now = new Date("2026-11-25T18:30:00Z");
    const { current, previous } = standingsWindows("day", now);
    expect(current.start).toEqual(now);
    expect(previous?.start.toISOString()).toBe("2026-11-24T18:30:00.000Z");
    expect(previous?.end).toEqual(now);
    expect(scoredAttempts(previous!)).toMatchObject({
      responseMs: { not: null },
      submittedAt: { lt: now },
      question: { releaseAt: { gte: previous!.start, lt: now } },
    });
  });

  it("closes the week at the start of Sunday, including across a month boundary", () => {
    const sunday = new Date("2026-08-01T18:30:00Z");
    const { current, previous } = standingsWindows("week", sunday);
    expect(current.start).toEqual(sunday);
    expect(previous?.start.toISOString()).toBe("2026-07-25T18:30:00.000Z");
    expect(previous?.end).toEqual(sunday);
  });

  it("moves into January with December as the completed month", () => {
    const newYear = new Date("2026-12-31T18:30:00Z");
    const { current, previous } = standingsWindows("month", newYear);
    expect(current.start).toEqual(newYear);
    expect(previous?.start.toISOString()).toBe("2026-11-30T18:30:00.000Z");
    expect(current.end?.toISOString()).toBe("2027-01-31T18:30:00.000Z");
    expect(standingsWindows("all", newYear).previous).toBeNull();
  });
});

describe("category badges", () => {
  it("unlocks each tier and tracks progress to the next tier", () => {
    expect(categoryBadgeProgress(4)).toMatchObject({ earned: null, next: { correct: 5 } });
    expect(categoryBadgeProgress(5)).toMatchObject({ earned: { title: "Specialist" }, next: { correct: 15 } });
    expect(categoryBadgeProgress(15)).toMatchObject({ earned: { title: "Expert" }, next: { correct: 35 } });
    expect(categoryBadgeProgress(35)).toMatchObject({ earned: { title: "Master" }, next: null });
  });
});
