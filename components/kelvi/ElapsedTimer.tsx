"use client";

import { useEffect, useState } from "react";

export function ElapsedTimer({ startedAt }: { startedAt: string }) {
  const [ms, setMs] = useState(() => Date.now() - new Date(startedAt).getTime());

  useEffect(() => {
    const id = window.setInterval(() => {
      setMs(Date.now() - new Date(startedAt).getTime());
    }, 50);
    return () => window.clearInterval(id);
  }, [startedAt]);

  const seconds = Math.max(0, ms / 1000);
  const label = seconds < 10 ? seconds.toFixed(2) : seconds.toFixed(1);

  return (
    <p className="font-serif text-lg tabular-nums tracking-wide text-muted" aria-live="off">
      {label}
    </p>
  );
}
