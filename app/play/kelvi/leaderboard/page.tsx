import { prisma } from "@/lib/db";
import { getLeaderboardState } from "@/lib/game/home";
import { existingPlayerId } from "@/lib/play-session";
import { LEADERBOARD_PERIODS } from "@/lib/game/standings";
import { TIMEZONE } from "@/lib/game/scoring";
import { PlayLink } from "@/components/layout/PlayFrame";
import { RankList, pointsRows, speedRows } from "@/components/kelvi/RankList";

export const dynamic = "force-dynamic";

const labels = { day: "Today", week: "Week", month: "Month", all: "All time" };
const titles = { day: "Today", week: "This week", month: "This month", all: "All-time leaders" };
const winners = { day: "Yesterday’s winners", week: "Last week’s winners", month: "Last month’s winners", all: "" };
const dateFormat = new Intl.DateTimeFormat("en-IN", { timeZone: TIMEZONE, day: "numeric", month: "short", year: "numeric" });

function dateRange(start: Date, end: Date) {
  const last = new Date(end.getTime() - 1);
  return start.getTime() + 86_400_000 === end.getTime()
    ? dateFormat.format(start)
    : dateFormat.formatRange(start, last);
}

export default async function LeaderboardPage({ searchParams }: {
  searchParams: Promise<{ period?: string }>;
}) {
  const [{ period: requested }, playerId] = await Promise.all([searchParams, existingPlayerId()]);
  const period = LEADERBOARD_PERIODS.find((item) => item === requested) ?? "week";
  const state = await getLeaderboardState(prisma, playerId, period);
  const rows = state.you && !state.rows.some((row) => row.isYou) ? [...state.rows, state.you] : state.rows;

  return (
    <>
      <h1 className="font-serif mt-3 text-5xl">Kelvi leaderboard</h1>
      <nav aria-label="Leaderboard period" className="mt-5 grid grid-cols-4 gap-2">
        {LEADERBOARD_PERIODS.map((item) => (
          <PlayLink key={item} href={`?period=${item}`} aria-current={item === period ? "page" : undefined}
            className={`rounded-xl border border-rule px-2 py-3 text-center text-sm ${item === period ? "bg-ink text-ivory" : "bg-cloud"}`}>
            {labels[item]}
          </PlayLink>
        ))}
      </nav>
      {state.unavailable ? <p role="alert" className="mt-6 text-terracotta">Standings are temporarily unavailable. Try again shortly.</p> : (
        <>
          {state.windows.previous ? (
            <section className="mt-5 rounded-2xl border border-rule bg-cloud px-5 py-5">
              <p className="mb-2 text-sm text-muted">{dateRange(state.windows.previous.start, state.windows.previous.end)} IST</p>
              <RankList title={winners[period]} rows={pointsRows(state.podium)} empty="No qualifying correct answers this period." />
              {period === "week" ? <p className="mt-3 text-xs text-muted">Weekly winners are announced Sunday at 12:00 AM IST.</p> : null}
              {period === "month" ? <p className="mt-3 text-xs text-muted">Monthly winners are announced on the 1st at 12:00 AM IST.</p> : null}
              {period === "day" ? <p className="mt-3 text-xs text-muted">Daily winners are announced at 12:00 AM IST.</p> : null}
            </section>
          ) : null}
          {period === "week" ? (
            <section className="mt-7 rounded-2xl border border-rule px-5 py-5">
              <h2 className="font-serif text-3xl">Category champions</h2>
              <p className="mt-2 text-sm text-muted">Last week’s top scorer in each category, with at least 3 correct answers.</p>
              {state.categoryChampions.length ? (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                  {state.categoryChampions.map((row) => (
                    <li key={row.slug} className="rounded-xl border border-rule bg-cloud px-4 py-3">
                      <span aria-hidden className="mr-2 text-terracotta">✦</span>
                      <span className="text-sm font-semibold">{row.category}</span>
                      <p className="mt-1 text-sm text-muted">{row.isYou ? "You" : row.displayName} · {row.points.toLocaleString("en-IN")} pts</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="mt-3 text-sm text-muted">No category crowns were earned last week.</p>}
            </section>
          ) : null}
          <div className="mt-7 rounded-2xl border border-rule px-5 py-5">
            <RankList title={titles[period]} rows={pointsRows(rows)} empty="No scored answers yet." />
          </div>
          {state.liveNumber ? (
            <div className="mt-7">
              <RankList title={`Fastest Fingers · Kelvi #${state.liveNumber}`} rows={speedRows(state.fasterFingers)} empty="Waiting for the first correct answer." />
            </div>
          ) : null}
        </>
      )}
      <ScoringInfo scoring={state.scoring} />
    </>
  );
}

function ScoringInfo({ scoring }: { scoring: Awaited<ReturnType<typeof getLeaderboardState>>["scoring"] }) {
  return (
    <details className="mt-7 rounded-2xl border border-rule px-5 py-4">
      <summary className="cursor-pointer text-sm font-semibold">How points work</summary>
      <p className="mt-3 text-sm text-muted">A correct answer earns {scoring.baseCorrectScore} points plus a speed bonus. Time is measured by the server from opening the question to receiving your answer. Incorrect answers earn {scoring.wrongScore} points. Practice is unscored.</p>
      <dl className="mt-3 space-y-1 text-sm">
        {scoring.speedBonuses.map(({ maxMs, bonus }, index) => (
          <div key={index} className="flex justify-between">
            <dt>{maxMs === null ? "After the last time band" : `Within ${maxMs / 1000} seconds`}</dt><dd>+{bonus} pts</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
