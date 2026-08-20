"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { assignRewardAction, markRewardRedeemedAction } from "@/lib/actions/admin";

function RewardsPanel({
  weekStart,
  players,
}: {
  weekStart: string;
  players: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-8 grid gap-3 rounded-2xl border border-rule p-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          await assignRewardAction({
            type: form.get("type"),
            playerId: String(form.get("playerId") ?? "") || undefined,
            voucherAmount: form.get("voucherAmount"),
            weekStart,
          });
          router.refresh();
        });
      }}
    >
      <select name="type" className="border-b border-rule bg-transparent py-2">
        <option value="WEEKLY_CHAMPION">Weekly Champion</option>
        <option value="FASTER_FINGERS">Faster Fingers</option>
        <option value="STREAK_DRAW">Streak Draw</option>
      </select>
      <select name="playerId" className="border-b border-rule bg-transparent py-2">
        <option value="">Auto-select eligible player</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {player.displayName}
          </option>
        ))}
      </select>
      <input name="voucherAmount" type="number" defaultValue={1000} className="border-b border-rule bg-transparent py-2" />
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-4 py-3 text-xs tracking-[0.16em] text-ivory uppercase"
      >
        {pending ? "Awarding…" : "Award voucher"}
      </button>
    </form>
  );
}

function Mark({ id, redeemed }: { id: string; redeemed: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          await markRewardRedeemedAction(id, !redeemed);
          router.refresh();
        });
      }}
      className="mt-2 text-[11px] tracking-[0.16em] uppercase text-muted"
    >
      {redeemed ? "Mark unredeemed" : "Mark redeemed"}
    </button>
  );
}

RewardsPanel.Mark = Mark;

export { RewardsPanel };
