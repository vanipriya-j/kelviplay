export type FasterFingersRow = {
  playerId: string;
  displayName: string;
  responseMs: number;
  rank: number;
  isYou: boolean;
};

export function rankFasterFingers(
  rows: { playerId: string; displayName: string; responseMs: number }[],
  youId?: string | null,
): FasterFingersRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (a.responseMs !== b.responseMs) return a.responseMs - b.responseMs;
    return a.playerId.localeCompare(b.playerId);
  });
  return sorted.map((row, index) => ({
    ...row,
    rank: index + 1,
    isYou: youId === row.playerId,
  }));
}

export function percentileFaster(rank: number, total: number): number {
  if (total <= 1) return 100;
  const slower = total - rank;
  return Math.max(0, Math.min(100, Math.round((slower / (total - 1)) * 100)));
}

export type WeeklyRow = {
  playerId: string;
  displayName: string;
  points: number;
  attempted: number;
  correct: number;
  avgResponseMs: number | null;
  rank: number;
  isYou: boolean;
};

export function rankWeekly(
  rows: {
    playerId: string;
    displayName: string;
    points: number;
    attempted: number;
    correct: number;
    totalResponseMs: number;
  }[],
  youId?: string | null,
): WeeklyRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.correct !== a.correct) return b.correct - a.correct;
    const aAvg = a.correct ? a.totalResponseMs / a.correct : Number.POSITIVE_INFINITY;
    const bAvg = b.correct ? b.totalResponseMs / b.correct : Number.POSITIVE_INFINITY;
    if (aAvg !== bAvg) return aAvg - bAvg;
    return a.playerId.localeCompare(b.playerId);
  });
  return sorted.map((row, index) => ({
    playerId: row.playerId,
    displayName: row.displayName,
    points: row.points,
    attempted: row.attempted,
    correct: row.correct,
    avgResponseMs: row.correct ? Math.round(row.totalResponseMs / row.correct) : null,
    rank: index + 1,
    isYou: youId === row.playerId,
  }));
}
