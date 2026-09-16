import type { PrismaClient } from "@prisma/client";
import { isUnusableOrigin, publicAppUrl } from "../app-url";
import {
  dailyWinnersCaption,
  buildDailyWinnersCard,
} from "../share/daily-card";
import {
  parsePublishAccounts,
  publishImageToInstagram,
  type InstagramPublishResult,
} from "../share/instagram";
import { getDailyWinners } from "./daily-winners";
import {
  broadcastConfigKey,
  isWinnersBoardPublic,
  parseIstDayKey,
  winnersBoardDay,
  winnersRevealAt,
} from "./rhythm";
import { getDayStart, istDayKey } from "./time";

export type BroadcastRecord = {
  dayKey: string;
  imageUrl: string;
  caption: string;
  publishedAt: string;
  accounts: InstagramPublishResult[];
};

export function dailyWinnersImagePath(dayKey: string) {
  return `/api/share/daily?day=${dayKey}`;
}

export function dailyWinnersImageUrl(dayKey: string) {
  const origin = publishableOrigin();
  return `${origin}${dailyWinnersImagePath(dayKey)}`;
}

export function publishableOrigin() {
  const origin = publicAppUrl();
  if (origin && !isUnusableOrigin(origin)) return origin;
  return "https://kelviplay.vercel.app";
}

export async function readBroadcast(db: PrismaClient, dayKey: string) {
  const row = await db.appConfig.findUnique({
    where: { key: broadcastConfigKey(dayKey) },
  });
  if (!row) return null;
  return row.value as BroadcastRecord;
}

export async function announceDailyWinners(
  db: PrismaClient,
  options: {
    now?: Date;
    dayKey?: string;
    skipInstagram?: boolean;
    /** Re-publish even if a handle already succeeded. */
    force?: boolean;
  } = {},
) {
  const now = options.now ?? new Date();
  const dayStart = resolveBroadcastDay(options.dayKey, now);
  if (!dayStart) {
    return { ok: false as const, error: "Invalid day." };
  }

  const dayKey = istDayKey(dayStart);
  if (!isWinnersBoardPublic(dayStart, now)) {
    return {
      ok: false as const,
      error: "Today's winners go up at 10 PM IST.",
      dayKey,
      revealAt: winnersRevealAt(dayStart).toISOString(),
    };
  }

  const winners = await getDailyWinners(db, dayStart);
  const card = buildDailyWinnersCard({
    dayKey,
    dayStart,
    podium: winners.podium,
    fastest: winners.fastest,
  });
  const imageUrl = dailyWinnersImageUrl(dayKey);
  const caption = dailyWinnersCaption(card);
  const previous = await readBroadcast(db, dayKey);
  const accounts = parsePublishAccounts();

  if (options.skipInstagram || accounts.length === 0) {
    const record: BroadcastRecord = {
      dayKey,
      imageUrl,
      caption,
      publishedAt: previous?.publishedAt ?? now.toISOString(),
      accounts:
        previous?.accounts ??
        (await publishImageToInstagram({
          imageUrl,
          caption,
          accounts: [],
          sleepMs: 0,
        })),
    };
    if (!previous) {
      await persistBroadcast(db, record);
    }
    return {
      ok: true as const,
      skipped: accounts.length === 0,
      dayKey,
      imageUrl,
      caption,
      winners,
      record: previous ?? record,
    };
  }

  const alreadyOk = new Set(
    (previous?.accounts ?? []).filter((row) => row.ok).map((row) => row.handle),
  );
  const pending = options.force
    ? accounts
    : accounts.filter((account) => !alreadyOk.has(account.handle));

  if (!pending.length && previous) {
    return {
      ok: true as const,
      skipped: true,
      dayKey,
      imageUrl,
      caption,
      winners,
      record: previous,
    };
  }

  const fresh = await publishImageToInstagram({
    imageUrl,
    caption,
    accounts: pending,
  });
  const merged = mergeAccountResults(previous?.accounts ?? [], fresh);
  const record: BroadcastRecord = {
    dayKey,
    imageUrl,
    caption,
    publishedAt: now.toISOString(),
    accounts: merged,
  };
  await persistBroadcast(db, record);

  return {
    ok: true as const,
    skipped: false,
    dayKey,
    imageUrl,
    caption,
    winners,
    record,
  };
}

export function resolveBroadcastDay(dayKey: string | undefined, now: Date) {
  if (dayKey) return parseIstDayKey(dayKey);
  return winnersBoardDay(now) ?? getDayStart(now);
}

function mergeAccountResults(
  previous: InstagramPublishResult[],
  next: InstagramPublishResult[],
) {
  const byHandle = new Map(previous.map((row) => [row.handle, row]));
  for (const row of next) {
    byHandle.set(row.handle, row);
  }
  return [...byHandle.values()];
}

async function persistBroadcast(db: PrismaClient, record: BroadcastRecord) {
  await db.appConfig.upsert({
    where: { key: broadcastConfigKey(record.dayKey) },
    update: { value: record },
    create: { key: broadcastConfigKey(record.dayKey), value: record },
  });
}
