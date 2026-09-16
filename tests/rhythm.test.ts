import { describe, expect, it } from "vitest";
import {
  alignToDropGrid,
  currentDropWindow,
  isWinnersBoardPublic,
  isWinnersLive,
  nextDropOnOrAfter,
  nextDropWindow,
  parseIstDayKey,
  winnersBoardDay,
  winnersRevealAt,
} from "@/lib/game/rhythm";
import { isLiveAt, parseIstDatetimeLocal } from "@/lib/game/time";

describe("2-hour IST drop grid", () => {
  it("opens the 8–10 AM IST window", () => {
    const now = new Date("2026-09-16T03:15:00.000Z"); // 8:45 AM IST
    const window = currentDropWindow(now);
    expect(window?.releaseAt.toISOString()).toBe("2026-09-16T02:30:00.000Z");
    expect(window?.expireAt.toISOString()).toBe("2026-09-16T04:30:00.000Z");
  });

  it("has no live drop between 10 PM and 6 AM", () => {
    expect(currentDropWindow(new Date("2026-09-16T16:45:00.000Z"))).toBeNull();
    expect(currentDropWindow(new Date("2026-09-16T23:00:00.000Z"))).toBeNull();
  });

  it("points the next drop at 6 AM after the last evening window", () => {
    const next = nextDropWindow(new Date("2026-09-16T16:30:00.000Z"));
    expect(next.releaseAt.toISOString()).toBe("2026-09-17T00:30:00.000Z");
  });

  it("schedules the adjacent 10 AM slot on or after 10 AM expiry", () => {
    const slot = nextDropOnOrAfter(new Date("2026-09-16T04:30:00.000Z"));
    expect(slot.releaseAt.toISOString()).toBe("2026-09-16T04:30:00.000Z");
  });

  it("snaps 7:30 AM IST onto 8:00 AM", () => {
    const aligned = alignToDropGrid(parseIstDatetimeLocal("2026-09-16T07:30"));
    expect(aligned.releaseAt.toISOString()).toBe("2026-09-16T02:30:00.000Z");
    expect(aligned.expireAt.toISOString()).toBe("2026-09-16T04:30:00.000Z");
  });
});

describe("10 PM winners board", () => {
  it("reveals at 10:00 PM IST (16:30 UTC)", () => {
    const reveal = winnersRevealAt(new Date("2026-09-16T10:00:00.000Z"));
    expect(reveal.toISOString()).toBe("2026-09-16T16:30:00.000Z");
  });

  it("is live from 10 PM until 6 AM", () => {
    expect(isWinnersLive(new Date("2026-09-16T16:29:00.000Z"))).toBe(false);
    expect(isWinnersLive(new Date("2026-09-16T16:30:00.000Z"))).toBe(true);
    expect(isWinnersLive(new Date("2026-09-17T00:29:00.000Z"))).toBe(true);
    expect(isWinnersLive(new Date("2026-09-17T00:30:00.000Z"))).toBe(false);
  });

  it("keeps yesterday's board after midnight", () => {
    const day = winnersBoardDay(new Date("2026-09-17T00:00:00.000Z"));
    expect(day?.toISOString()).toBe("2026-09-15T18:30:00.000Z");
  });

  it("does not publish a board before that day's 10 PM", () => {
    const day = parseIstDayKey("2026-09-16");
    expect(day).not.toBeNull();
    expect(isWinnersBoardPublic(day!, new Date("2026-09-16T16:29:00.000Z"))).toBe(false);
    expect(isWinnersBoardPublic(day!, new Date("2026-09-16T16:30:00.000Z"))).toBe(true);
  });
});

describe("live window", () => {
  it("expires at the start of 10 PM so winners can take the portal", () => {
    const question = {
      releaseAt: new Date("2026-09-16T14:30:00.000Z"),
      expireAt: new Date("2026-09-16T16:30:00.000Z"),
      status: "SCHEDULED",
    };
    expect(isLiveAt(question, new Date("2026-09-16T16:29:59.000Z"))).toBe(true);
    expect(isLiveAt(question, new Date("2026-09-16T16:30:00.000Z"))).toBe(false);
  });
});
