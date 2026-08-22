"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlayNowButton } from "./PlayNowButton";
import { LiveDot, Wordmark } from "@/components/brand/Wordmark";
import type { getHomeState } from "@/lib/game/home";

type HomeState = Awaited<ReturnType<typeof getHomeState>>;

export function KelviHome({ initial }: { initial: HomeState }) {
  const [state, setState] = useState(initial);

  useEffect(() => {
    const id = window.setInterval(async () => {
      const response = await fetch("/api/kelvi/home", { cache: "no-store" });
      if (!response.ok) return;
      setState((await response.json()) as HomeState);
    }, 12000);
    return () => window.clearInterval(id);
  }, []);

  const live = state.live;

  return (
    <div className="flex flex-1 flex-col">
      <Wordmark />

      {live ? (
        <section className="mt-14 text-center">
          <p className="inline-flex items-center gap-2 text-[11px] tracking-[0.28em] uppercase text-terracotta">
            <LiveDot />
            Live
          </p>
          <h1 className="font-serif mt-4 text-4xl leading-tight tracking-wide">
            KELVI #{live.number}
            <br />
            IS LIVE
          </h1>
          <p className="mt-4 text-sm tracking-wide text-muted">How fast do you know it?</p>
          <p className="mt-6 text-lg text-ink">
            <span className="font-serif text-3xl">{live.playingCount}</span>
            <span className="ml-2 text-sm tracking-[0.12em] uppercase text-muted">
              people are playing
            </span>
          </p>
          <div className="mt-10">
            <PlayNowButton alreadyPlayed={live.alreadyPlayed} attemptId={live.attemptId} />
          </div>
        </section>
      ) : (
        <section className="mt-14 text-center">
          <p className="text-[11px] tracking-[0.28em] uppercase text-muted">Next Kelvi</p>
          <h1 className="font-serif mt-4 text-4xl leading-tight">The next Kelvi could drop anytime.</h1>
          {state.next ? (
            <p className="mt-5 text-sm tracking-wide text-muted">
              Next Kelvi {state.next.windowLabel.toLowerCase()}
            </p>
          ) : (
            <p className="mt-5 text-sm text-muted">A new drop is being set.</p>
          )}
        </section>
      )}

      {state.setupNeeded ? (
        <p className="mt-8 rounded-2xl border border-rule bg-cloud px-4 py-3 text-sm text-muted">
          Kelvi is on the Aarla OS database, but schema <span className="text-ink">kelvi</span> is
          not set up yet. Open{" "}
          <Link href="/setup" className="text-ink underline decoration-rule underline-offset-4">
            /setup
          </Link>{" "}
          once, then refresh.
        </p>
      ) : null}

      <dl className="mt-12 grid grid-cols-2 gap-3">
        <Stat label="Streak" value={`🔥 ${state.stats.currentStreak}`} />
        <Stat
          label="This week"
          value={state.stats.weeklyRank ? `🏆 #${state.stats.weeklyRank}` : "—"}
        />
      </dl>

      {state.stats.nextMilestone ? (
        <p className="mt-4 text-center text-xs tracking-[0.16em] uppercase text-muted">
          Next milestone · {state.stats.nextMilestone} in a row
        </p>
      ) : null}

      {!live ? (
        <>
          <p className="mt-10 text-[11px] tracking-[0.22em] uppercase text-muted">Today</p>
          <p className="mt-2 font-serif text-2xl">
            {state.stats.todayCompleted}
            <span className="text-lg text-muted"> / {state.stats.todayTotal} Kelvis</span>
          </p>
          <div className="mt-8">
            <p className="text-[11px] tracking-[0.22em] uppercase text-muted">This week</p>
            <ul className="mt-3 space-y-2">
              {state.weeklyPreview.map((row) => (
                <li key={row.playerId} className="flex justify-between border-b border-rule py-2 text-sm">
                  <span>
                    {row.rank}. {row.isYou ? "You" : row.displayName}
                  </span>
                  <span className="tabular-nums">{row.points.toLocaleString("en-IN")}</span>
                </li>
              ))}
            </ul>
          </div>
          {state.recentAchievements.length ? (
            <div className="mt-8">
              <p className="text-[11px] tracking-[0.22em] uppercase text-muted">Recent</p>
              <ul className="mt-3 space-y-2">
                {state.recentAchievements.map((item) => (
                  <li key={item.code} className="text-sm">
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-rule bg-cloud px-4 py-4">
      <dt className="text-[10px] tracking-[0.2em] uppercase text-muted">{label}</dt>
      <dd className="mt-1 font-serif text-2xl">{value}</dd>
    </div>
  );
}
