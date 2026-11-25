"use client";

import { useState, useTransition } from "react";
import { syncCatalogAction } from "@/lib/actions/admin";

type SyncState = {
  rows: number;
  folderUrl: string;
  sheetUrl: string;
  imagesFolderUrl: string;
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

  function sync() {
    start(async () => {
      const response = await syncCatalogAction();
      if (!response.ok) {
        setError(response.error ?? "Could not sync.");
        return;
      }
      setError(null);
      setState({
        rows: response.rows,
        folderUrl: response.folderUrl,
        sheetUrl: response.sheetUrl,
        imagesFolderUrl: response.imagesFolderUrl,
      });
    });
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending || !configured}
          onClick={() => sync()}
          className="rounded-full bg-ink px-5 py-3 text-xs tracking-[0.16em] text-ivory uppercase disabled:opacity-40"
        >
          {pending ? "Syncing…" : "Sync listing"}
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
          <li>
            Put GPT stills in <span className="text-ink">images/</span> as{" "}
            <span className="text-ink">kelvi-NNNN-question.png</span> and{" "}
            <span className="text-ink">kelvi-NNNN-answer.png</span>. Those pictures show on the play
            question.
          </li>
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
          this folder private — the sheet includes answers. Sync updates the listing only; it does
          not overwrite stills.
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
          Listed {state.rows} Kelvis.{" "}
          {state.sheetUrl ? (
            <a href={state.sheetUrl} target="_blank" rel="noreferrer" className="underline">
              Open sheet
            </a>
          ) : null}
          {state.imagesFolderUrl ? (
            <>
              {" · "}
              <a href={state.imagesFolderUrl} target="_blank" rel="noreferrer" className="underline">
                Open stills
              </a>
            </>
          ) : null}
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">{total} Kelvis ready to list.</p>
      )}
    </div>
  );
}
