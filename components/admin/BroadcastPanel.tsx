"use client";

import { useState, useTransition } from "react";
import { publishWinnersAction } from "@/lib/actions/admin";

type AccountRow = {
  handle: string;
  ok: boolean;
  skipped?: boolean;
  error?: string;
  mediaId?: string;
};

export function BroadcastPanel({
  dayKey,
  configured,
  last,
}: {
  dayKey: string;
  configured: boolean;
  last: { publishedAt: string; accounts: AccountRow[] } | null;
}) {
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AccountRow[] | null>(last?.accounts ?? null);
  const [pending, start] = useTransition();

  return (
    <div className="mt-8">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const response = await publishWinnersAction({ dayKey, force: true });
            if (!response.ok) {
              setError(response.error ?? "Could not publish.");
              return;
            }
            setError(null);
            setResult(response.accounts);
          });
        }}
        className="rounded-full bg-ink px-5 py-3 text-xs tracking-[0.16em] text-ivory uppercase"
      >
        {pending ? "Publishing…" : "Publish tonight’s image"}
      </button>
      {!configured ? (
        <p className="mt-4 text-sm text-muted">
          Set <span className="text-ink">INSTAGRAM_PUBLISH_ACCOUNTS</span> on Vercel to post to
          @aarla.play, @aarla.kanakangi, and @aarla.merch. The portal still shows the image at 10 PM
          without it.
        </p>
      ) : null}
      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}
      {result?.length ? (
        <ul className="mt-6 divide-y divide-rule">
          {result.map((row) => (
            <li key={row.handle} className="flex justify-between py-3 text-sm">
              <span>@{row.handle}</span>
              <span className="text-muted">
                {row.ok ? "Published" : row.skipped ? "Skipped" : row.error ?? "Failed"}
              </span>
            </li>
          ))}
        </ul>
      ) : last ? (
        <p className="mt-4 text-xs uppercase tracking-wide text-muted">
          Last publish {new Date(last.publishedAt).toLocaleString("en-IN")}
        </p>
      ) : null}
    </div>
  );
}
