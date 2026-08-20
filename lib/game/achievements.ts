export const ACHIEVEMENTS = [
  {
    code: "STREAK_3",
    name: "3 IN A ROW",
    description: "Three consecutive correct Kelvis.",
  },
  {
    code: "STREAK_7",
    name: "7 IN A ROW",
    description: "Seven consecutive correct Kelvis.",
  },
  {
    code: "STREAK_15",
    name: "15 KELVI STREAK",
    description: "Fifteen consecutive correct Kelvis.",
  },
  {
    code: "STREAK_30",
    name: "30 KELVI STREAK",
    description: "Thirty consecutive correct Kelvis.",
  },
  {
    code: "STREAK_50",
    name: "50 KELVI STREAK",
    description: "Fifty consecutive correct Kelvis.",
  },
  {
    code: "STREAK_100",
    name: "100 KELVI STREAK",
    description: "One hundred consecutive correct Kelvis.",
  },
  {
    code: "FIRST_TOP_10",
    name: "FIRST TOP 10",
    description: "Landed in the Faster Fingers top ten.",
  },
  {
    code: "FASTEST_FINGERS",
    name: "FASTEST FINGERS",
    description: "The fastest correct answer on a Kelvi.",
  },
  {
    code: "PERFECT_DAY",
    name: "PERFECT DAY",
    description: "Every Kelvi you played today, correct.",
  },
] as const;

export type AchievementCode = (typeof ACHIEVEMENTS)[number]["code"];

export function streakAchievementCode(milestone: number): AchievementCode | null {
  const code = `STREAK_${milestone}`;
  return ACHIEVEMENTS.some((item) => item.code === code)
    ? (code as AchievementCode)
    : null;
}
