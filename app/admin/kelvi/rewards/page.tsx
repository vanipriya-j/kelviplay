import { prisma } from "@/lib/db";
import { RewardsPanel } from "@/components/admin/RewardsPanel";
import { getWeekStart } from "@/lib/game/time";
import { publicName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RewardsPage() {
  const weekStart = getWeekStart();
  const [rewards, players] = await Promise.all([
    prisma.reward.findMany({
      orderBy: { weekStart: "desc" },
      include: { player: { select: { displayName: true } } },
    }),
    prisma.player.findMany({
      where: { isGuest: false },
      select: { id: true, displayName: true },
      orderBy: { displayName: "asc" },
      take: 100,
    }),
  ]);

  return (
    <div>
      <h1 className="font-serif text-4xl">Weekly rewards</h1>
      <p className="mt-2 text-sm text-muted">₹1,000 Aarla voucher. Pick your Aarla. Redemption is manual for MVP.</p>
      <RewardsPanel
        weekStart={weekStart.toISOString()}
        players={players.map((player) => ({ id: player.id, displayName: publicName(player.displayName) }))}
      />
      <ul className="mt-10 divide-y divide-rule">
        {rewards.map((reward) => (
          <li key={reward.id} className="py-4 text-sm">
            <p className="font-serif text-xl">{reward.type.replaceAll("_", " ")}</p>
            <p className="mt-1">
              {reward.player ? publicName(reward.player.displayName) : "Unassigned"} · ₹
              {reward.voucherAmount} · {reward.voucherCode}
            </p>
            <p className="mt-1 text-muted">
              {reward.redeemedAt ? "Redeemed" : "Issued"} · week of {reward.weekStart.toISOString().slice(0, 10)}
            </p>
            <MarkRedeemed id={reward.id} redeemed={Boolean(reward.redeemedAt)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MarkRedeemed({ id, redeemed }: { id: string; redeemed: boolean }) {
  return <RewardsPanel.Mark id={id} redeemed={redeemed} />;
}
