import Link from "next/link";
import { prisma } from "@/lib/db";
import { categoryBadgeProgress } from "@/lib/game/achievements";
import { getProfileState } from "@/lib/game/home";
import { existingPlayerId } from "@/lib/play-session";
import { formatResponseSeconds } from "@/lib/game/time";
import { ProfileForm } from "@/components/kelvi/ProfileForm";
import { SignOutButton } from "@/components/kelvi/SignOutButton";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const playerId = await existingPlayerId();
  if (!playerId) {
    return (
      <>
        <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Aarla Play</p>
        <h1 className="font-serif mt-3 text-5xl leading-tight">Play first.</h1>
        <p className="mt-4 text-sm text-muted">
          Open the live Kelvi as guest. Add email later if you want to keep the streak.
        </p>
        <Link
          href="/play/kelvi"
          className="mt-10 block w-full rounded-full bg-ink py-4 text-center text-sm tracking-[0.22em] text-ivory uppercase"
        >
          Back to Kelvi
        </Link>
      </>
    );
  }
  const state = await getProfileState(prisma, playerId);
  if (!state) {
    return (
      <>
        <h1 className="font-serif mt-14 text-4xl">Seat not found.</h1>
        <Link href="/play/kelvi" className="mt-8 inline-block text-sm tracking-[0.18em] uppercase">
          Back to Kelvi
        </Link>
      </>
    );
  }

  return (
    <>
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
        <h2 className="font-serif text-3xl">Category badges</h2>
        <p className="mt-2 text-sm text-muted">Earn Specialist, Expert, and Master at 5, 15, and 35 correct answers in a category.</p>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {state.categories.map((category) => {
            const { earned, next } = categoryBadgeProgress(category.correct);
            return (
              <li key={category.slug} className="rounded-2xl border border-rule bg-cloud px-4 py-4">
                <h3 className="text-sm font-semibold">{category.name}</h3>
                {earned ? <p className="mt-1 text-terracotta"><span aria-hidden>{earned.symbol} </span>{earned.title}</p> : null}
                <p className="mt-2 text-xs text-muted">{category.correct} correct · {category.accuracy}% accuracy</p>
                {next ? (
                  <div className="mt-2">
                    <progress className="w-full accent-terracotta" value={category.correct} max={next.correct} aria-label={`${category.name} ${next.title} progress`} />
                    <p className="text-xs text-muted">{next.correct - category.correct} to {next.title}</p>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
        {state.categories.length === 0 ? <p className="mt-4 text-sm text-muted">Play a live round to start earning badges.</p> : null}
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
    </>
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
