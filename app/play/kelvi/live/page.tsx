"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { openLiveKelviAction } from "@/lib/actions/kelvi";
import { PlaySkeleton } from "@/components/layout/PlayFrame";
import { LiveQuestion } from "@/components/kelvi/LiveQuestion";
import { PresenceBeacon } from "@/components/kelvi/PresenceBeacon";
import Link from "next/link";

export default function LiveKelviPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [opened, setOpened] = useState<Awaited<
    ReturnType<typeof openLiveKelviAction>
  > | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function boot() {
      try {
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
  }, [router]);

  if (error) {
    return (
      <>
        <p className="text-[11px] tracking-[0.28em] uppercase text-muted">Kelvi</p>
        <h1 className="font-serif mt-8 text-4xl">Not this drop.</h1>
        <p className="mt-4 text-muted">{error}</p>
        <Link href="/play/kelvi" className="mt-10 inline-block text-sm tracking-[0.18em] uppercase">
          Back home
        </Link>
      </>
    );
  }

  if (!opened || !opened.ok || opened.opened.alreadySubmitted || !("question" in opened.opened)) {
    return <PlaySkeleton />;
  }

  const payload = opened.opened;

  return (
    <>
      <PresenceBeacon questionId={payload.question.id} />
      <LiveQuestion question={payload.question} startedAt={payload.startedAt} />
    </>
  );
}
