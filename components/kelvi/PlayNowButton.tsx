"use client";

import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function PlayNowButton({
  alreadyPlayed,
  attemptId,
}: {
  alreadyPlayed?: boolean;
  attemptId?: string;
}) {
  const router = useRouter();
  const { status } = useSession();
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
      if (status !== "authenticated") {
        const result = await signIn("kelvi", { kind: "guest", redirect: false });
        if (result?.error) {
          setError("Could not open a guest seat. Run npm run db:setup if this is a fresh install.");
          setPending(false);
          return;
        }
      }
      router.push("/play/kelvi/live");
      router.refresh();
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
        className={cn(
          "w-full rounded-full bg-ink py-4 text-sm tracking-[0.28em] text-ivory uppercase transition-opacity",
          pending && "opacity-70",
        )}
      >
        {alreadyPlayed ? "SEE RESULT" : pending ? "OPENING…" : "PLAY NOW"}
      </button>
      {error ? <p className="mt-3 text-center text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
