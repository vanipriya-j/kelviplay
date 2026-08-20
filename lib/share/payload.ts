import { formatResponseSeconds } from "../game/time";
import { publicName } from "../utils";

export type ShareVariant = "result" | "fastest" | "streak" | "weekly";

export type ShareCardModel = {
  variant: ShareVariant;
  kelviNumber: number | null;
  displayName: string;
  responseSeconds: string | null;
  rankLabel: string | null;
  streak: number | null;
  headline: string;
  subhead: string;
  cta: string;
  brand: string;
  handle: string;
  url: string;
};

const FORBIDDEN_KEYS = [
  "question",
  "questionText",
  "correctAnswer",
  "acceptableAnswers",
  "answer",
  "options",
] as const;

export function assertNoSpoilers(payload: unknown) {
  const text = JSON.stringify(payload).toLowerCase();
  for (const key of FORBIDDEN_KEYS) {
    if (text.includes(`"${key.toLowerCase()}"`)) {
      throw new Error(`Share payload leaked ${key}`);
    }
  }
}

export function buildShareCard(input: {
  variant?: ShareVariant;
  kelviNumber: number;
  displayName: string;
  responseMs: number | null;
  rank: number | null;
  streak: number;
  isFastest?: boolean;
  weeklyChampion?: boolean;
}): ShareCardModel {
  const displayName = publicName(input.displayName, "A PLAYER");
  const responseSeconds =
    input.responseMs != null ? formatResponseSeconds(input.responseMs) : null;
  const shareUrl = process.env.NEXT_PUBLIC_SHARE_URL ?? "https://play.aarla.com/k";

  if (input.weeklyChampion || input.variant === "weekly") {
    return {
      variant: "weekly",
      kelviNumber: null,
      displayName,
      responseSeconds: null,
      rankLabel: null,
      streak: null,
      headline: "KELVI WEEKLY CHAMPION",
      subhead: displayName.toUpperCase(),
      cta: "PICK YOUR AARLA",
      brand: "AARLA PLAY",
      handle: "@aarla.play",
      url: shareUrl,
    };
  }

  if (input.variant === "streak") {
    return {
      variant: "streak",
      kelviNumber: input.kelviNumber,
      displayName,
      responseSeconds: null,
      rankLabel: null,
      streak: input.streak,
      headline: `${input.streak} KELVIS.`,
      subhead: `${input.streak} CORRECT.`,
      cta: "AARLA PLAY",
      brand: "AARLA PLAY",
      handle: "@aarla.play",
      url: shareUrl,
    };
  }

  if (input.isFastest || input.variant === "fastest") {
    return {
      variant: "fastest",
      kelviNumber: input.kelviNumber,
      displayName,
      responseSeconds,
      rankLabel: input.rank ? `#${input.rank} TODAY` : null,
      streak: input.streak,
      headline: "FASTEST FINGERS",
      subhead: responseSeconds ? `${responseSeconds} SEC` : "",
      cta: "CAN YOU BEAT ME?",
      brand: "AARLA PLAY",
      handle: "@aarla.play",
      url: shareUrl,
    };
  }

  return {
    variant: "result",
    kelviNumber: input.kelviNumber,
    displayName,
    responseSeconds,
    rankLabel: input.rank ? `#${input.rank} FASTEST` : null,
    streak: input.streak,
    headline: responseSeconds ? `${responseSeconds} SEC` : "KELVI",
    subhead: input.rank ? `#${input.rank} FASTEST` : "I PLAYED KELVI",
    cta: "CAN YOU BEAT ME?",
    brand: "AARLA PLAY",
    handle: "@aarla.play",
    url: shareUrl,
  };
}

export function pickShareVariant(input: {
  correct: boolean;
  rank: number | null;
  recentAchievementCodes: string[];
}): ShareVariant {
  if (input.recentAchievementCodes.includes("FASTEST_FINGERS") || input.rank === 1) {
    return "fastest";
  }
  if (input.recentAchievementCodes.some((code) => code.startsWith("STREAK_"))) {
    return "streak";
  }
  return "result";
}
