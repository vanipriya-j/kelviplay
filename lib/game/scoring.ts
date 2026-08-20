export type SpeedBonusBand = {
  maxMs: number | null;
  bonus: number;
};

export type ScoringConfig = {
  baseCorrectScore: number;
  wrongScore: number;
  speedBonuses: SpeedBonusBand[];
};

export type StreakRule =
  | "consecutive_correct"
  | "participation"
  | "custom";

export const DEFAULT_SCORING: ScoringConfig = {
  baseCorrectScore: 100,
  wrongScore: 0,
  speedBonuses: [
    { maxMs: 3_000, bonus: 50 },
    { maxMs: 5_000, bonus: 40 },
    { maxMs: 10_000, bonus: 30 },
    { maxMs: 20_000, bonus: 20 },
    { maxMs: 30_000, bonus: 10 },
    { maxMs: null, bonus: 0 },
  ],
};

export const STREAK_MILESTONES = [3, 7, 15, 30, 50, 100] as const;

export const DEFAULT_STREAK_RULE: StreakRule = "consecutive_correct";

export const KELVI_SLUG = "kelvi";

export const TIMEZONE = "Asia/Kolkata";

export const PRESENCE_TTL_MS = 60_000;

export const FASTER_FINGERS_TOP = 10;

export const DEFAULT_REWARDS = {
  weeklyChampionAmount: 1000,
  fasterFingersAmount: 500,
  streakDrawAmount: 500,
  streakDrawThreshold: 7,
  voucherExpiryDays: 90,
};

export function parseScoringConfig(raw: unknown): ScoringConfig {
  if (!raw || typeof raw !== "object") return DEFAULT_SCORING;
  const value = raw as Partial<ScoringConfig>;
  const baseCorrectScore =
    typeof value.baseCorrectScore === "number"
      ? value.baseCorrectScore
      : DEFAULT_SCORING.baseCorrectScore;
  const wrongScore =
    typeof value.wrongScore === "number"
      ? value.wrongScore
      : DEFAULT_SCORING.wrongScore;
  const speedBonuses = Array.isArray(value.speedBonuses)
    ? value.speedBonuses
        .filter(
          (band): band is SpeedBonusBand =>
            !!band &&
            typeof band === "object" &&
            typeof band.bonus === "number" &&
            (band.maxMs === null || typeof band.maxMs === "number"),
        )
        .sort((a, b) => {
          if (a.maxMs === null) return 1;
          if (b.maxMs === null) return -1;
          return a.maxMs - b.maxMs;
        })
    : DEFAULT_SCORING.speedBonuses;
  return {
    baseCorrectScore,
    wrongScore,
    speedBonuses: speedBonuses.length ? speedBonuses : DEFAULT_SCORING.speedBonuses,
  };
}

export function computeScore(input: {
  correct: boolean;
  responseMs: number;
  scoring?: ScoringConfig;
}): { score: number; base: number; speedBonus: number } {
  const scoring = input.scoring ?? DEFAULT_SCORING;
  if (!input.correct) {
    return { score: scoring.wrongScore, base: 0, speedBonus: 0 };
  }
  const band =
    scoring.speedBonuses.find(
      (item) => item.maxMs === null || input.responseMs <= item.maxMs,
    ) ?? scoring.speedBonuses[scoring.speedBonuses.length - 1];
  const speedBonus = band?.bonus ?? 0;
  return {
    score: scoring.baseCorrectScore + speedBonus,
    base: scoring.baseCorrectScore,
    speedBonus,
  };
}

export function nextStreak(
  current: number,
  correct: boolean,
  rule: StreakRule = DEFAULT_STREAK_RULE,
): number {
  if (rule === "participation") {
    return current + 1;
  }
  if (correct) return current + 1;
  return 0;
}

export function nextMilestone(streak: number, milestones = STREAK_MILESTONES): number | null {
  return milestones.find((value) => value > streak) ?? null;
}

export function hitMilestones(
  previous: number,
  next: number,
  milestones = STREAK_MILESTONES,
): number[] {
  return milestones.filter((value) => previous < value && next >= value);
}
