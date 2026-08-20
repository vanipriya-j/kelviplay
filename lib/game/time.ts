import { TIMEZONE } from "./scoring";

const WEEKDAY_OFFSET: Record<string, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

export function zonedParts(date: Date, timeZone = TIMEZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const read = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return {
    weekday: read("weekday"),
    year: Number(read("year")),
    month: Number(read("month")),
    day: Number(read("day")),
    hour: Number(read("hour")),
    minute: Number(read("minute")),
    second: Number(read("second")),
  };
}

/** Convert a calendar datetime in `timeZone` to a UTC Date. */
export function zonedDateTimeToUtc(
  parts: {
    year: number;
    month: number;
    day: number;
    hour?: number;
    minute?: number;
    second?: number;
  },
  timeZone = TIMEZONE,
): Date {
  const hour = parts.hour ?? 0;
  const minute = parts.minute ?? 0;
  const second = parts.second ?? 0;
  const guess = Date.UTC(parts.year, parts.month - 1, parts.day, hour, minute, second);
  const asZoned = zonedParts(new Date(guess), timeZone);
  const actualAsUtc = Date.UTC(
    asZoned.year,
    asZoned.month - 1,
    asZoned.day,
    asZoned.hour,
    asZoned.minute,
    asZoned.second,
  );
  const offset = actualAsUtc - guess;
  return new Date(guess - offset);
}

export function getWeekStart(date = new Date(), timeZone = TIMEZONE): Date {
  const zoned = zonedParts(date, timeZone);
  const daysFromMonday = WEEKDAY_OFFSET[zoned.weekday] ?? 0;
  const monday = zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
  return new Date(monday.getTime() - daysFromMonday * 24 * 60 * 60 * 1000);
}

export function getDayStart(date = new Date(), timeZone = TIMEZONE): Date {
  const zoned = zonedParts(date, timeZone);
  return zonedDateTimeToUtc(
    {
      year: zoned.year,
      month: zoned.month,
      day: zoned.day,
      hour: 0,
      minute: 0,
      second: 0,
    },
    timeZone,
  );
}

export function formatWindowLabel(releaseAt: Date, expireAt: Date, timeZone = TIMEZONE): string {
  const start = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: expireAt.getMinutes() === 0 && releaseAt.getMinutes() === 0 ? undefined : "2-digit",
    hour12: true,
  }).format(releaseAt);
  const end = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: expireAt.getMinutes() === 0 && releaseAt.getMinutes() === 0 ? undefined : "2-digit",
    hour12: true,
  }).format(expireAt);
  return `between ${start.replace(/\s/g, " ").toUpperCase()} – ${end.replace(/\s/g, " ").toUpperCase()}`;
}

export function formatClock(date: Date, timeZone = TIMEZONE): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
    .format(date)
    .toUpperCase();
}

export function formatResponseSeconds(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) return `${seconds.toFixed(2)}`;
  if (seconds < 60) return `${seconds.toFixed(1)}`;
  const minutes = Math.floor(seconds / 60);
  const rem = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${rem}`;
}

export function formatResponseLabel(ms: number): string {
  return `${formatResponseSeconds(ms)} SEC`;
}

export function isLiveAt(
  question: { releaseAt: Date; expireAt: Date; status: string },
  now = new Date(),
): boolean {
  if (question.status === "DRAFT" || question.status === "ARCHIVED") return false;
  return now >= question.releaseAt && now <= question.expireAt;
}

export function computeQuestionStatus(
  question: { releaseAt: Date; expireAt: Date; status: string },
  now = new Date(),
): string {
  if (question.status === "DRAFT" || question.status === "ARCHIVED") {
    return question.status;
  }
  if (now < question.releaseAt) return "SCHEDULED";
  if (now > question.expireAt) return "EXPIRED";
  return "LIVE";
}
