import { prisma } from "@/lib/db";
import { getLeaderboardState } from "@/lib/game/home";
import { existingPlayerId } from "@/lib/play-session";
import { formatResponseSeconds } from "@/lib/game/time";
import { RankList, pointsRows, speedRows } from "@/components/kelvi/RankList";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const playerId = await existingPlayerId();
  const state = await getLeaderboardState(prisma, playerId);

  return (
    <>
      <p className="text-center text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi weekly</p>
      <h1 className="font-serif mt-3 text-center text-4xl">Play. Stay sharp. Top the week.</h1>
      <p className="mt-3 text-center text-sm text-muted">₹1,000 Aarla voucher · Pick your Aarla.</p>

      {state.liveNumber ? (
        <div className="mt-10">
          <RankList
            title={`Faster fingers · Kelvi #${state.liveNumber}`}
            rows={speedRows(state.fasterFingers)}
          />
        </div>
      ) : null}

      <div className="mt-12">
        <RankList title="This week" rows={pointsRows(state.weekly)} />
      </div>

      {state.youWeekly ? (
        <section className="mt-10 rounded-2xl border border-rule bg-cloud px-4 py-5">
          <p className="text-[10px] tracking-[0.22em] uppercase text-muted">You</p>
          <p className="font-serif mt-2 text-3xl">#{state.youWeekly.rank}</p>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-muted">Attempted</dt>
              <dd>{state.you?.attempted ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Correct</dt>
              <dd>{state.you?.correct ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Streak</dt>
              <dd>{state.you?.currentStreak ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted">Avg time</dt>
              <dd>
                {state.you?.avgResponseMs
                  ? `${formatResponseSeconds(state.you.avgResponseMs)}s`
                  : "—"}
              </dd>
            </div>
          </dl>
        </section>
      ) : (
        <p className="mt-10 text-center text-sm text-muted">Play today’s Kelvi to enter the week.</p>
      )}
    </>
  );
}
