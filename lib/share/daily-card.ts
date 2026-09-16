import { AARLA_HANDLES, cadenceCopy, formatIstDayLabel } from "../game/rhythm";
import type { DailyFastest, DailyPodiumPlace } from "../game/daily-winners";
import { publicName } from "../utils";
import { assertNoSpoilers } from "./payload";

export type DailyWinnersCard = {
  variant: "daily";
  dayKey: string;
  dayLabel: string;
  headline: string;
  subhead: string;
  podium: Array<{
    rank: number;
    displayName: string;
    points: number;
    bestSeconds: string | null;
  }>;
  fastestName: string | null;
  fastestSeconds: string | null;
  cta: string;
  brand: string;
  handles: string[];
  url: string;
  cadence: string;
};

export function dailyShareUrl() {
  return process.env.NEXT_PUBLIC_SHARE_URL ?? "https://play.aarla.com/k";
}

export function buildDailyWinnersCard(input: {
  dayKey: string;
  dayStart: Date;
  podium: DailyPodiumPlace[];
  fastest: DailyFastest | null;
}): DailyWinnersCard {
  const card: DailyWinnersCard = {
    variant: "daily",
    dayKey: input.dayKey,
    dayLabel: formatIstDayLabel(input.dayStart),
    headline: "TODAY'S WINNERS",
    subhead: formatIstDayLabel(input.dayStart).toUpperCase(),
    podium: input.podium.map((row) => ({
      rank: row.rank,
      displayName: publicName(row.displayName, "A PLAYER").toUpperCase(),
      points: row.points,
      bestSeconds: row.bestSeconds,
    })),
    fastestName: input.fastest
      ? publicName(input.fastest.displayName, "A PLAYER").toUpperCase()
      : null,
    fastestSeconds: input.fastest?.seconds ?? null,
    cta: "PLAY KELVI",
    brand: "AARLA PLAY",
    handles: AARLA_HANDLES.map((handle) => `@${handle}`),
    url: dailyShareUrl(),
    cadence: cadenceCopy(),
  };
  assertNoSpoilers(card);
  return card;
}

export function dailyWinnersCaption(card: DailyWinnersCard) {
  const medals = ["🥇", "🥈", "🥉"];
  const podiumLines =
    card.podium.length > 0
      ? card.podium
          .map((row, index) => `${medals[index] ?? `#${row.rank}`} ${row.displayName}`)
          .join("\n")
      : "No winners tonight — come play tomorrow.";
  const fastest = card.fastestName
    ? `\n⚡ Fastest fingers: ${card.fastestName}${card.fastestSeconds ? ` · ${card.fastestSeconds}s` : ""}`
    : "";
  return [
    `Kelvi — ${card.dayLabel}`,
    "",
    "Today's winners",
    podiumLines,
    fastest,
    "",
    card.cadence,
    card.url,
    "",
    card.handles.join(" "),
  ]
    .filter((line) => line != null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
