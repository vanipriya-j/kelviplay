import Link from "next/link";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { LiveDot } from "@/components/brand/Wordmark";
import { prisma } from "@/lib/db";
import { getLiveQuestion } from "@/lib/game/engine";

export const dynamic = "force-dynamic";

export default async function PlayLandingPage() {
  const [session, live] = await Promise.all([auth(), getLiveQuestion(prisma)]);

  return (
    <AppShell>
      <p className="text-center text-[10px] tracking-[0.4em] uppercase text-muted">Aarla Play</p>
      <h1 className="font-serif mt-6 text-center text-5xl leading-none">A club for people who still know things.</h1>
      <p className="mt-5 text-center text-sm leading-relaxed text-muted">
        Live cultural games. Fast fingers. Weekly bragging rights. Pick your Aarla.
      </p>

      <Link
        href="/play/kelvi"
        className="paper-grain mt-12 block rounded-[28px] border border-rule px-5 py-8"
      >
        <p className="flex items-center gap-2 text-[10px] tracking-[0.28em] uppercase text-terracotta">
          {live ? (
            <>
              <LiveDot /> Kelvi is live
            </>
          ) : (
            "Now playing"
          )}
        </p>
        <p className="font-serif mt-3 text-4xl tracking-[0.12em]">KELVI</p>
        <p className="mt-3 text-sm text-muted">A question drops. Answer fast. Protect the streak.</p>
        <p className="mt-6 text-[11px] tracking-[0.22em] uppercase">Enter →</p>
      </Link>

      <div className="mt-6 grid gap-3">
        <Soon name="Kolam Kraze" line="Pattern, memory, quiet speed." />
        <Soon name="Sabha Canteen" line="Filter coffee, hierarchy, gossip." />
        <Soon name="Pallanguzhi" line="The old counting game, remade." />
        <Soon name="Aadu Puli Aattam" line="Goats, tigers, a board between." />
      </div>

      <div className="mt-10 text-center text-xs text-muted">
        {session?.user ? `Playing as ${session.user.displayName}` : <Link href="/auth">Sign in to keep your streak</Link>}
      </div>
    </AppShell>
  );
}

function Soon({ name, line }: { name: string; line: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-rule px-4 py-4">
      <p className="font-serif text-xl text-ink/80">{name}</p>
      <p className="mt-1 text-sm text-muted">{line}</p>
    </div>
  );
}
