import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getAttemptResult } from "@/lib/game/engine";
import { formatResponseSeconds } from "@/lib/game/time";
import { pickShareVariant } from "@/lib/share/payload";
import { AppShell, BottomNav } from "@/components/layout/AppShell";
import { ShareResultButton } from "@/components/kelvi/ShareResultButton";
import { LeaderboardLink, RankList, speedRows } from "@/components/kelvi/RankList";

export const dynamic = "force-dynamic";

export default async function ResultPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/auth");
  const { attemptId } = await params;
  const result = await getAttemptResult(prisma, attemptId, session.user.id);
  if (!result) notFound();

  const variant = pickShareVariant({
    correct: result.attempt.correct,
    rank: result.rank,
    recentAchievementCodes: result.recentAchievements.map((item) => item.code),
  });

  return (
    <AppShell footer={<BottomNav current="home" />}>
      <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi #{result.question.number}</p>

      {result.attempt.correct ? (
        <div>
          <p className="animate-rise mt-10 text-[11px] tracking-[0.32em] uppercase text-terracotta">
            Correct ⚡
          </p>
          <h1 className="animate-rise delay-1 font-serif mt-3 text-6xl tracking-wide">
            {result.attempt.responseMs != null
              ? `${formatResponseSeconds(result.attempt.responseMs)} SEC`
              : "LOCKED"}
          </h1>
          {result.rank ? (
            <p className="animate-rise delay-2 mt-4 font-serif text-2xl">#{result.rank} fastest on this Kelvi</p>
          ) : null}
          {result.percentile != null ? (
            <p className="animate-rise delay-3 mt-2 text-sm text-muted">
              Faster than {result.percentile}% of players
            </p>
          ) : null}
          <p className="animate-rise delay-4 mt-8 text-lg">
            <span className="animate-flame">🔥</span> {result.streak} Kelvi streak
            <span className="ml-3 text-muted">+{result.attempt.score} points</span>
          </p>
        </div>
      ) : (
        <div>
          <p className="mt-10 text-[11px] tracking-[0.32em] uppercase text-muted">Not this one</p>
          <h1 className="font-serif mt-3 text-5xl leading-tight">The next drop is still yours.</h1>
          <p className="mt-6 text-lg">
            <span className="animate-flame">🔥</span> {result.streak} Kelvi streak
          </p>
          <p className="mt-2 text-sm text-muted">Streak follows consecutive correct Kelvis.</p>
        </div>
      )}

      {result.recentAchievements.length ? (
        <ul className="mt-8 space-y-1">
          {result.recentAchievements.map((item) => (
            <li key={item.code} className="text-[11px] tracking-[0.18em] uppercase text-forest">
              {item.name}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-10">
        <RankList title="Faster fingers" rows={speedRows(result.fasterFingers)} />
      </div>

      <div className="mt-10 space-y-3">
        {result.attempt.correct ? (
          <ShareResultButton attemptId={result.attempt.id} variant={variant} />
        ) : null}
        <LeaderboardLink />
        <Link href="/play/kelvi" className="block text-center text-xs tracking-[0.18em] uppercase text-muted">
          Back to Kelvi
        </Link>
      </div>
    </AppShell>
  );
}
