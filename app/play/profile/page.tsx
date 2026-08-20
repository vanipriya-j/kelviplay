import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProfileState } from "@/lib/game/home";
import { formatResponseSeconds } from "@/lib/game/time";
import { AppShell, BottomNav } from "@/components/layout/AppShell";
import { ProfileForm } from "@/components/kelvi/ProfileForm";
import { SignOutButton } from "@/components/kelvi/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth?next=/play/profile");
  const state = await getProfileState(prisma, session.user.id);
  if (!state) redirect("/auth");

  return (
    <AppShell footer={<BottomNav current="profile" />}>
      <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Aarla Play</p>
      <h1 className="font-serif mt-3 text-5xl uppercase tracking-wide">{state.player.displayName}</h1>
      {state.player.city ? <p className="mt-2 text-sm text-muted">{state.player.city}</p> : null}

      <dl className="mt-8 grid grid-cols-2 gap-3">
        <Card label="Streak" value={`🔥 ${state.stats.currentStreak}`} />
        <Card label="Weekly rank" value={state.stats.weeklyRank ? `#${state.stats.weeklyRank}` : "—"} />
        <Card
          label="Best Kelvi"
          value={state.stats.bestResponseMs ? `${formatResponseSeconds(state.stats.bestResponseMs)} sec` : "—"}
        />
        <Card label="Accuracy" value={`${state.stats.accuracy}%`} />
      </dl>
      <p className="mt-4 text-sm text-muted">Played {state.stats.played}</p>

      <section className="mt-10">
        <h2 className="text-[11px] tracking-[0.22em] uppercase text-muted">Categories</h2>
        <ul className="mt-4 space-y-3">
          {state.categories.map((category) => (
            <li key={category.slug}>
              <div className="flex justify-between text-sm">
                <span>{category.name}</span>
                <span className="text-muted">{category.accuracy}%</span>
              </div>
              <div className="mt-1 h-px bg-rule">
                <div className="h-px bg-ink" style={{ width: `${Math.max(6, category.accuracy)}%` }} />
              </div>
            </li>
          ))}
          {state.categories.length === 0 ? (
            <li className="text-sm text-muted">Play a few Kelvis and this will fill in quietly.</li>
          ) : null}
        </ul>
      </section>

      <div className="mt-10">
        <ProfileForm
          displayName={state.player.displayName}
          city={state.player.city ?? ""}
          instagramHandle={state.player.instagramHandle ?? ""}
          isGuest={state.player.isGuest}
        />
      </div>

      <div className="mt-8 text-center">
        <SignOutButton />
      </div>
    </AppShell>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule px-4 py-4">
      <dt className="text-[10px] tracking-[0.18em] uppercase text-muted">{label}</dt>
      <dd className="font-serif mt-1 text-2xl">{value}</dd>
    </div>
  );
}
