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

  async function onPlay() {
    setPending(true);
    try {
      if (alreadyPlayed && attemptId) {
        router.push(`/play/kelvi/result/${attemptId}`);
        return;
      }
      if (status !== "authenticated") {
        const result = await signIn("kelvi", { kind: "guest", redirect: false });
        if (result?.error) {
          setPending(false);
          return;
        }
      }
      router.push("/play/kelvi/live");
      router.refresh();
    } catch {
      setPending(false);
    }
  }

  return (
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
  );
}
