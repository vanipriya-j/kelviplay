import { describe, expect, it } from "vitest";
import { getWeekStart } from "@/lib/game/time";

describe("weekly reset", () => {
  it("starts the week at Monday 00:00 Asia/Kolkata", () => {
    const thursday = new Date("2026-08-20T05:09:00.000Z");
    const start = getWeekStart(thursday);
    expect(start.toISOString()).toBe("2026-08-16T18:30:00.000Z");
  });
});
