"use client";

import { useEffect, useState } from "react";

export function PresenceBeacon({ questionId }: { questionId: string }) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let timer: number | undefined;
    async function beat() {
      try {
        const response = await fetch("/api/kelvi/presence", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ questionId }),
          signal: controller.signal,
        });
        if (response.ok) {
          const data = await response.json();
          if (!controller.signal.aborted) setCount(data.playingCount);
        } else if (response.status === 404) {
          if (!controller.signal.aborted) setCount(null);
          return;
        }
      } catch {
        // The next heartbeat will refresh the count after reconnection.
      }
      if (!controller.signal.aborted) timer = window.setTimeout(beat, 8000);
    }
    void beat();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [questionId]);

  return count === null ? null : (
    <p className="mt-2 text-xs text-muted tabular-nums">
      <span aria-hidden className="mr-1 text-terracotta">●</span>
      {count} {count === 1 ? "player" : "players"} answering now
    </p>
  );
}
