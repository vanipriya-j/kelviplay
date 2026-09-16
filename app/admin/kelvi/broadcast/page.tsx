import { prisma } from "@/lib/db";
import { BroadcastPanel } from "@/components/admin/BroadcastPanel";
import { getDailyWinners } from "@/lib/game/daily-winners";
import { dailyWinnersImagePath, readBroadcast } from "@/lib/game/broadcast";
import { cadenceCopy, formatIstDayLabel, winnersBoardDay } from "@/lib/game/rhythm";
import { getDayStart, istDayKey } from "@/lib/game/time";
import { parsePublishAccounts } from "@/lib/share/instagram";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const now = new Date();
  const day = winnersBoardDay(now) ?? getDayStart(now);
  const dayKey = istDayKey(day);
  const [winners, last] = await Promise.all([
    getDailyWinners(prisma, day).catch(() => null),
    readBroadcast(prisma, dayKey).catch(() => null),
  ]);
  const configured = parsePublishAccounts().length > 0;

  return (
    <div>
      <h1 className="font-serif text-4xl">Tonight</h1>
      <p className="mt-2 text-muted">{cadenceCopy()}</p>
      <p className="mt-1 text-sm text-muted">{formatIstDayLabel(day)}</p>

      <div className="mx-auto mt-8 max-w-[240px] overflow-hidden rounded-[24px] border border-rule bg-cloud">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${dailyWinnersImagePath(dayKey)}&preview=1`}
          alt={`Kelvi winners for ${formatIstDayLabel(day)}`}
          className="w-full"
        />
      </div>

      {winners?.podium.length ? (
        <ol className="mt-8 space-y-2">
          {winners.podium.map((row) => (
            <li key={row.playerId} className="flex justify-between border-b border-rule py-2 text-sm">
              <span>
                {row.rank}. {row.displayName}
              </span>
              <span className="tabular-nums">{row.points.toLocaleString("en-IN")}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-8 text-sm text-muted">No winners yet for this board.</p>
      )}

      <BroadcastPanel
        dayKey={dayKey}
        configured={configured}
        last={
          last
            ? {
                publishedAt: last.publishedAt,
                accounts: last.accounts,
              }
            : null
        }
      />
    </div>
  );
}
