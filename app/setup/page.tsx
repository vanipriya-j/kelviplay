"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Wordmark } from "@/components/brand/Wordmark";
import { initializeKelviAction } from "@/lib/actions/setup";

export default function SetupPage() {
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [ok, setOk] = useState<boolean | null>(null);

  return (
    <AppShell>
      <Wordmark />
      <h1 className="font-serif mt-14 text-4xl leading-tight">Open the room.</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted">
        One-time setup on the Aarla OS Supabase database. Creates schema{" "}
        <span className="text-ink">kelvi</span> only — commerce tables in{" "}
        <span className="text-ink">public</span> stay untouched.
      </p>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Paste <span className="text-ink">AUTH_SECRET</span> from Vercel → kelviplay → Settings →
        Environment Variables. Click the eye to reveal it. That value is the Auth.js session key
        already on this project — not a new password. If you later add{" "}
        <span className="text-ink">SETUP_SECRET</span>, use that instead.
      </p>

      <form
        className="mt-10 space-y-4"
        action={(formData) => {
          start(async () => {
            const result = await initializeKelviAction(formData);
            setOk(result.ok);
            setMessage(result.message);
          });
        }}
      >
        <label className="block text-xs tracking-[0.18em] uppercase text-muted">
          AUTH_SECRET from Vercel
          <input
            name="secret"
            type="password"
            required
            autoComplete="off"
            placeholder="the value behind the lock"
            className="mt-2 w-full rounded-2xl border border-rule bg-cloud px-4 py-3 text-sm tracking-normal text-ink normal-case"
          />
        </label>
        <label className="flex items-start gap-3 text-sm text-muted">
          <input name="reloadDemo" type="checkbox" className="mt-1" />
          Reload demo questions and players (wipes Kelvi schema data only)
        </label>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-ink py-4 text-sm tracking-[0.22em] text-ivory uppercase disabled:opacity-60"
        >
          {pending ? "Setting up…" : "Initialize Kelvi"}
        </button>
      </form>

      {message ? (
        <p className={`mt-6 text-sm ${ok ? "text-ink" : "text-terracotta"}`}>{message}</p>
      ) : null}

      {ok ? (
        <Link
          href="/play/kelvi"
          className="mt-8 block w-full rounded-full border border-ink py-4 text-center text-sm tracking-[0.22em] uppercase"
        >
          Enter Kelvi
        </Link>
      ) : null}
    </AppShell>
  );
}
