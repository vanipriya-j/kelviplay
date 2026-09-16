import { TIMEZONE } from "./scoring";
import {
  getDayStart,
  istDayKey,
  pad2,
  zonedDateTimeToUtc,
  zonedParts,
} from "./time";

/** Live Kelvis drop on this 2-hour IST grid. Last window is 8:00–10:00 PM. */
export const DROP_HOURS_IST = [6, 8, 10, 12, 14, 16, 18, 20] as const;
export const DROP_DURATION_HOURS = 2;
export const WINNERS_HOUR_IST = 22;
export const FIRST_DROP_HOUR_IST = DROP_HOURS_IST[0];

export const AARLA_HANDLES = ["aarla.play", "aarla.kanakangi", "aarla.merch"] as const;

export function dropWindowAt(
  parts: { year: number; month: number; day: number; hour: number },
  timeZone = TIMEZONE,
) {
  const releaseAt = zonedDateTimeToUtc(
    { year: parts.year, month: parts.month, day: parts.day, hour: parts.hour, minute: 0, second: 0 },
    timeZone,
  );
  return {
    releaseAt,
    expireAt: new Date(releaseAt.getTime() + DROP_DURATION_HOURS * 60 * 60 * 1000),
  };
}

export function currentDropWindow(now = new Date(), timeZone = TIMEZONE) {
  const zoned = zonedParts(now, timeZone);
  const hour = DROP_HOURS_IST.find((start) => zoned.hour >= start && zoned.hour < start + DROP_DURATION_HOURS);
  if (hour == null) return null;
  return dropWindowAt({ year: zoned.year, month: zoned.month, day: zoned.day, hour }, timeZone);
}

export function nextDropWindow(now = new Date(), timeZone = TIMEZONE) {
  return nextDropAfter(now, timeZone, false);
}

/** Next 2-hour slot whose release is on or after `now` (admin scheduling). */
export function nextDropOnOrAfter(now = new Date(), timeZone = TIMEZONE) {
  return nextDropAfter(now, timeZone, true);
}

function nextDropAfter(now: Date, timeZone: string, inclusive: boolean) {
  const zoned = zonedParts(now, timeZone);
  const laterToday = DROP_HOURS_IST.find((hour) => {
    const window = dropWindowAt({ year: zoned.year, month: zoned.month, day: zoned.day, hour }, timeZone);
    return inclusive
      ? window.releaseAt.getTime() >= now.getTime()
      : window.releaseAt.getTime() > now.getTime();
  });
  if (laterToday != null) {
    return dropWindowAt({ year: zoned.year, month: zoned.month, day: zoned.day, hour: laterToday }, timeZone);
  }
  const tomorrow = new Date(getDayStart(now, timeZone).getTime() + 24 * 60 * 60 * 1000);
  const next = zonedParts(tomorrow, timeZone);
  return dropWindowAt(
    { year: next.year, month: next.month, day: next.day, hour: FIRST_DROP_HOUR_IST },
    timeZone,
  );
}

/** Snap a datetime onto the 6am–8pm IST two-hour grid. */
export function alignToDropGrid(date: Date, timeZone = TIMEZONE) {
  const zoned = zonedParts(date, timeZone);
  const hour = DROP_HOURS_IST.find((start) => zoned.hour <= start) ?? null;
  if (hour == null) {
    return nextDropOnOrAfter(new Date(getDayStart(date, timeZone).getTime() + 24 * 60 * 60 * 1000), timeZone);
  }
  return dropWindowAt({ year: zoned.year, month: zoned.month, day: zoned.day, hour }, timeZone);
}

export function parseIstDayKey(dayKey: string, timeZone = TIMEZONE): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dayKey.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return zonedDateTimeToUtc(
    { year, month, day, hour: 0, minute: 0, second: 0 },
    timeZone,
  );
}

export function broadcastConfigKey(dayKey: string) {
  return `broadcast:${dayKey}`;
}

export function winnersRevealAt(date = new Date(), timeZone = TIMEZONE) {
  const start = getDayStart(date, timeZone);
  const zoned = zonedParts(start, timeZone);
  return zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: WINNERS_HOUR_IST,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

/**
 * From 10:00 PM IST until 6:00 AM the next morning, the portal shows that day's winners.
 * After midnight the calendar day has rolled, so we still use the previous IST day.
 */
export function winnersBoardDay(now = new Date(), timeZone = TIMEZONE): Date | null {
  const zoned = zonedParts(now, timeZone);
  if (zoned.hour >= WINNERS_HOUR_IST) {
    return getDayStart(now, timeZone);
  }
  if (zoned.hour < FIRST_DROP_HOUR_IST) {
    return new Date(getDayStart(now, timeZone).getTime() - 24 * 60 * 60 * 1000);
  }
  return null;
}

export function isWinnersLive(now = new Date(), timeZone = TIMEZONE) {
  return winnersBoardDay(now, timeZone) != null;
}

/** The daily board is public once that IST day's 10 PM reveal has been reached. */
export function isWinnersBoardPublic(dayStart: Date, now = new Date(), timeZone = TIMEZONE) {
  return winnersRevealAt(dayStart, timeZone).getTime() <= now.getTime();
}

export function formatIstDayLabel(dayStart: Date, timeZone = TIMEZONE) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(dayStart);
}

export function cadenceCopy() {
  return "A question drops every 2 hours. Today’s winners go up at 10 PM.";
}

export { istDayKey, pad2 };
