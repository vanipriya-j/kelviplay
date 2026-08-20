"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { requestMagicLinkAction } from "@/lib/actions/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Wordmark } from "@/components/brand/Wordmark";

const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_AUTH);
const demoEnabled = process.env.NODE_ENV !== "production";

export function AuthForm({ next = "/play/kelvi" }: { next?: string }) {
  const [preview, setPreview] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <AppShell>
      <Wordmark />
      <h1 className="font-serif mt-12 text-4xl leading-tight">Keep the streak. Enter the week.</h1>
      <p className="mt-4 text-sm text-muted">
        Google, Apple, or email. Instagram is optional, and never required to play.
      </p>

      <div className="mt-10 space-y-3">
        {googleEnabled ? (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl: next })}
            className="w-full rounded-full border border-ink py-3 text-sm tracking-[0.18em] uppercase"
          >
            Continue with Google
          </button>
        ) : null}

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            start(async () => {
              const result = await requestMagicLinkAction({
                email: String(form.get("email") ?? ""),
                displayName: String(form.get("displayName") ?? ""),
              });
              if (!result.ok) setError(result.error);
              else setPreview(result.previewUrl);
            });
          }}
        >
          <input
            name="displayName"
            required
            placeholder="Public name"
            className="w-full border-b border-rule bg-transparent py-3 outline-none"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full border-b border-rule bg-transparent py-3 outline-none"
          />
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-ink py-3 text-sm tracking-[0.18em] text-ivory uppercase"
          >
            {pending ? "Sending…" : "Email a sign-in link"}
          </button>
        </form>

        {preview ? (
          <p className="text-sm">
            Demo link:{" "}
            <a className="underline" href={preview}>
              open magic link
            </a>
          </p>
        ) : null}
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}

        <button
          type="button"
          onClick={() => signIn("kelvi", { kind: "guest", callbackUrl: next })}
          className="w-full py-3 text-xs tracking-[0.18em] uppercase text-muted"
        >
          Play as guest
        </button>
      </div>

      {demoEnabled ? (
        <div className="mt-10 border-t border-rule pt-6">
          <p className="text-[10px] tracking-[0.2em] uppercase text-muted">Demo</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {["Meera", "Karthik", "Ananya", "admin"].map((name) => (
              <button
                key={name}
                type="button"
                onClick={() =>
                  signIn("kelvi", { kind: "demo", demoKey: name, callbackUrl: next })
                }
                className="rounded-full border border-rule px-3 py-1 text-xs"
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
