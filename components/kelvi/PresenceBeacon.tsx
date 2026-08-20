"use client";

import { useEffect } from "react";

export function PresenceBeacon({ questionId }: { questionId: string }) {
  useEffect(() => {
    let cancelled = false;
    async function beat() {
      if (cancelled) return;
      await fetch("/api/kelvi/presence", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ questionId }),
      });
    }
    void beat();
    const id = window.setInterval(beat, 8000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [questionId]);
  return null;
}
