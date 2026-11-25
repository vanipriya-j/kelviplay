"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { playNowAction } from "@/lib/actions/kelvi";
import { PlaySpinner } from "@/components/layout/PlayFrame";
import { cn } from "@/lib/utils";

export function PlayNowButton({
  alreadyPlayed,
  attemptId,
}: {
  alreadyPlayed?: boolean;
  attemptId?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPlay() {
    setPending(true);
    setError(null);
    try {
      if (alreadyPlayed && attemptId) {
        router.push(`/play/kelvi/result/${attemptId}`);
        return;
      }
      const result = await playNowAction();
      if (!result.ok) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.push("/play/kelvi/live");
    } catch {
      setError("Could not open this Kelvi. Try again.");
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onPlay}
        disabled={pending}
        aria-busy={pending}
        className={cn(
          "kelvi-cta w-full rounded-xl py-4 text-sm tracking-[0.28em] uppercase transition-opacity",
          pending && "opacity-70",
        )}
      >
        {pending ? <span role="status" className="inline-flex items-center gap-2"><PlaySpinner /> Opening…</span> : alreadyPlayed ? "See result" : "Play now"}
      </button>
      {error ? <p role="alert" className="mt-3 text-center text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
