"use client";

import { useState, useTransition } from "react";
import { syncCatalogAction } from "@/lib/actions/admin";

type SyncState = {
  rows: number;
  uploaded: number;
  errors: Array<{ number: number; error: string }>;
  nextNumber: number | null;
  folderUrl: string;
  sheetUrl: string;
};

export function CatalogPanel({
  configured,
  serviceEmail,
  folderUrl,
  total,
}: {
  configured: boolean;
  serviceEmail: string;
  folderUrl: string;
  total: number;
}) {
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<SyncState | null>(null);
  const [pending, start] = useTransition();

  function sync(afterNumber?: number) {
    start(async () => {
      const response = await syncCatalogAction({ afterNumber });
      if (!response.ok) {
        setError(response.error ?? "Could not sync.");
        return;
      }
      setError(null);
      setState((prev) => ({
        rows: response.rows,
        uploaded: (remaining ? prev?.uploaded ?? 0 : 0) + response.uploaded.length,
        errors: [...(remaining ? prev?.errors ?? [] : []), ...response.errors],
        nextNumber: response.nextNumber,
        folderUrl: response.folderUrl,
        sheetUrl: response.sheetUrl,
      }));
    });
  }

  const remaining = state?.nextNumber != null;

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || !configured}
          onClick={() => sync(remaining ? state.nextNumber ?? undefined : undefined)}
          className="rounded-full bg-ink px-5 py-3 text-xs tracking-[0.16em] text-ivory uppercase disabled:opacity-40"
        >
          {pending ? "Syncing…" : remaining ? "Continue images" : "Sync to Drive"}
        </button>
        <a
          href="/api/catalog/csv"
          className="rounded-full border border-rule px-5 py-3 text-xs tracking-[0.16em] uppercase"
        >
          Download CSV
        </a>
      </div>

      {!configured ? (
        <ol className="mt-6 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>Create a Google Drive folder named Kelvi.</li>
          <li>Create a Google Cloud service account and download its JSON key.</li>
          <li>Share the folder with that service account as Editor.</li>
          <li>
            Set <span className="text-ink">GOOGLE_DRIVE_FOLDER_ID</span> and{" "}
            <span className="text-ink">GOOGLE_SERVICE_ACCOUNT_JSON</span> on Vercel, then redeploy.
          </li>
        </ol>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Shared with <span className="text-ink">{serviceEmail || "the service account"}</span>. Keep
          this folder private — the sheet includes answers.
        </p>
      )}

      {folderUrl ? (
        <p className="mt-3 text-sm">
          <a href={folderUrl} target="_blank" rel="noreferrer" className="underline">
            Open Drive folder
          </a>
        </p>
      ) : null}

      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}

      {state ? (
        <p className="mt-4 text-sm text-muted">
          Listing {state.rows} Kelvis. Uploaded {state.uploaded} images
          {remaining ? " so far" : ""}.{" "}
          {state.sheetUrl ? (
            <a href={state.sheetUrl} target="_blank" rel="noreferrer" className="underline">
              Open sheet
            </a>
          ) : null}
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">{total} Kelvis ready to list.</p>
      )}

      {state?.errors.length ? (
        <ul className="mt-4 space-y-1 text-sm text-terracotta">
          {state.errors.map((row) => (
            <li key={row.number}>
              #{row.number}: {row.error}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
