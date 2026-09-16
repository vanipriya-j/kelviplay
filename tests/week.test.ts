import { describe, expect, it } from "vitest";
import { getWeekStart, parseIstDatetimeLocal } from "@/lib/game/time";

describe("weekly reset", () => {
  it("starts the week at Monday 00:00 Asia/Kolkata", () => {
    const thursday = new Date("2026-08-20T05:09:00.000Z");
    const start = getWeekStart(thursday);
    expect(start.toISOString()).toBe("2026-08-16T18:30:00.000Z");
  });

  it("parses datetime-local as Asia/Kolkata", () => {
    const parsed = parseIstDatetimeLocal("2026-09-16T22:00");
    expect(parsed.toISOString()).toBe("2026-09-16T16:30:00.000Z");
  });
});
