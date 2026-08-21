"use client";

import { signIn } from "next-auth/react";
import { useState, useTransition } from "react";
import { requestMagicLinkAction } from "@/lib/actions/auth";
import { AppShell } from "@/components/layout/AppShell";
import { Wordmark } from "@/components/brand/Wordmark";

const googleEnabled = Boolean(process.env.NEXT_PUBLIC_GOOGLE_AUTH);
const demoEnabled = process.env.NODE_ENV !== "production";

const AUTH_ERRORS: Record<string, string> = {
  Configuration: "Kelvi couldn't start a session. Try Play as guest.",
  CredentialsSignin: "That sign-in did not work. Try Play as guest.",
  AccessDenied: "That account cannot enter.",
  Verification: "That link has expired. Request a new one.",
  Default: "Sign-in hit a snag. Try again, or play as guest.",
};

export function AuthForm({
  next = "/play/kelvi",
  errorCode,
}: {
  next?: string;
  errorCode?: string;
}) {
  const [preview, setPreview] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(
    errorCode ? AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default : null,
  );
  const [pending, start] = useTransition();

  async function enterAsGuest() {
    const result = await signIn("kelvi", { kind: "guest", redirect: false });
    if (result?.error) {
      setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
      return;
    }
    window.location.assign(next);
  }

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
              setError(null);
              try {
                const result = await requestMagicLinkAction({
                  email: String(form.get("email") ?? ""),
                  displayName: String(form.get("displayName") ?? ""),
                });
                if (!result.ok) setError(result.error);
                else setPreview(result.previewUrl);
              } catch {
                setError("Could not start email sign-in. Try Play as guest.");
              }
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
            Email is not wired yet. Open your sign-in link:{" "}
            <a className="underline" href={preview}>
              enter Kelvi
            </a>
          </p>
        ) : null}
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}

        <button
          type="button"
          onClick={() => void enterAsGuest()}
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
                onClick={() => {
                  void (async () => {
                    const result = await signIn("kelvi", {
                      kind: "demo",
                      demoKey: name,
                      redirect: false,
                    });
                    if (result?.error) {
                      setError(AUTH_ERRORS[result.error] ?? AUTH_ERRORS.Default);
                      return;
                    }
                    window.location.assign(next);
                  })();
                }}
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
