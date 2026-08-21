"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { openLiveKelviAction } from "@/lib/actions/kelvi";
import { AppShell } from "@/components/layout/AppShell";
import { LiveQuestion } from "@/components/kelvi/LiveQuestion";
import { PresenceBeacon } from "@/components/kelvi/PresenceBeacon";
import Link from "next/link";

export default function LiveKelviPage() {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<Awaited<
    ReturnType<typeof openLiveKelviAction>
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      if (status === "loading") return;
      try {
        if (status !== "authenticated") {
          const signed = await signIn("kelvi", { kind: "guest", redirect: false });
          if (signed?.error) {
            setError("Could not open a guest seat. Try again in a moment.");
            return;
          }
          return;
        }
        const result = await openLiveKelviAction();
        if (cancelled) return;
        if (!result.ok) {
          setError(result.message ?? "The Kelvi just slipped away.");
          return;
        }
        if (result.opened.alreadySubmitted) {
          router.replace(`/play/kelvi/result/${result.opened.attemptId}`);
          return;
        }
        setOpened(result);
      } catch {
        if (!cancelled) setError("Could not open this Kelvi. Try again.");
      }
    }
    void boot();
    return () => {
      cancelled = true;
    };
  }, [status, router]);

  if (error) {
    return (
      <AppShell>
        <p className="text-[11px] tracking-[0.28em] uppercase text-muted">Kelvi</p>
        <h1 className="font-serif mt-8 text-4xl">Not this drop.</h1>
        <p className="mt-4 text-muted">{error}</p>
        <Link href="/play/kelvi" className="mt-10 inline-block text-sm tracking-[0.18em] uppercase">
          Back home
        </Link>
      </AppShell>
    );
  }

  if (!opened || !opened.ok || opened.opened.alreadySubmitted || !("question" in opened.opened)) {
    return (
      <AppShell>
        <p className="animate-kelvi-pulse mt-32 text-center font-serif text-3xl tracking-[0.2em]">KELVI</p>
      </AppShell>
    );
  }

  const payload = opened.opened;

  return (
    <AppShell>
      <PresenceBeacon questionId={payload.question.id} />
      <LiveQuestion question={payload.question} startedAt={payload.startedAt} />
    </AppShell>
  );
}
