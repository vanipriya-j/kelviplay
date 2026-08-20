"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Wordmark } from "@/components/brand/Wordmark";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <AppShell>
      <Wordmark />
      <h1 className="font-serif mt-14 text-4xl leading-tight">The room hiccuped.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        Kelvi is still here. If this is a fresh checkout, run{" "}
        <code className="text-ink">npm run db:setup</code> and try again.
      </p>
      <div className="mt-10 space-y-3">
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-full bg-ink py-4 text-sm tracking-[0.22em] text-ivory uppercase"
        >
          Try again
        </button>
        <Link
          href="/play/kelvi"
          className="block w-full rounded-full border border-ink py-4 text-center text-sm tracking-[0.22em] uppercase"
        >
          Back to Kelvi
        </Link>
      </div>
    </AppShell>
  );
}
