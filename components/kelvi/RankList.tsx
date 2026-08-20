import Link from "next/link";
import { publicName } from "@/lib/utils";
import { formatResponseSeconds } from "@/lib/game/time";
import { cn } from "@/lib/utils";

type Row = {
  rank: number;
  displayName: string;
  isYou: boolean;
  value: string;
};

export function RankList({
  title,
  rows,
  empty = "No one has locked in yet.",
}: {
  title: string;
  rows: Row[];
  empty?: string;
}) {
  return (
    <section>
      <h2 className="text-[11px] tracking-[0.28em] uppercase text-muted">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ol className="mt-4 space-y-1">
          {rows.map((row) => (
            <li
              key={`${row.rank}-${row.displayName}`}
              className={cn(
                "flex items-baseline justify-between py-2",
                row.isYou && "bg-paper px-3 -mx-3 rounded-xl",
              )}
            >
              <span className="text-sm">
                <span className="mr-3 font-serif text-muted">{row.rank}</span>
                {row.isYou ? "You" : publicName(row.displayName)}
              </span>
              <span className="tabular-nums text-sm">{row.value}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function speedRows(
  rows: { rank: number; displayName: string; isYou: boolean; responseMs: number }[],
): Row[] {
  return rows.map((row) => ({
    rank: row.rank,
    displayName: row.displayName,
    isYou: row.isYou,
    value: `${formatResponseSeconds(row.responseMs)}s`,
  }));
}

export function pointsRows(
  rows: { rank: number; displayName: string; isYou: boolean; points: number }[],
): Row[] {
  return rows.map((row) => ({
    rank: row.rank,
    displayName: row.displayName,
    isYou: row.isYou,
    value: row.points.toLocaleString("en-IN"),
  }));
}

export function LeaderboardLink() {
  return (
    <Link
      href="/play/kelvi/leaderboard"
      className="block w-full rounded-full border border-ink py-4 text-center text-sm tracking-[0.22em] uppercase"
    >
      SEE LEADERBOARD
    </Link>
  );
}
