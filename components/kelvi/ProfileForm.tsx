"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProfileAction } from "@/lib/actions/profile";

export function ProfileForm({
  displayName,
  city,
  instagramHandle,
  isGuest,
}: {
  displayName: string;
  city: string;
  instagramHandle: string;
  isGuest: boolean;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await updateProfileAction({
            displayName: String(form.get("displayName") ?? ""),
            city: String(form.get("city") ?? ""),
            instagramHandle: String(form.get("instagramHandle") ?? ""),
          });
          setMessage(result.ok ? "Saved." : result.error ?? "Could not save.");
        });
      }}
    >
      {isGuest ? (
        <p className="rounded-2xl border border-rule bg-cloud px-4 py-3 text-sm">
          Guest streaks stay on this device until you{" "}
          <Link href="/auth" className="underline">
            create an account
          </Link>
          .
        </p>
      ) : null}
      <label className="block text-xs tracking-[0.16em] uppercase text-muted">
        Public name
        <input
          name="displayName"
          defaultValue={displayName}
          required
          className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base text-ink outline-none"
        />
      </label>
      <label className="block text-xs tracking-[0.16em] uppercase text-muted">
        City
        <input
          name="city"
          defaultValue={city}
          className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base text-ink outline-none"
        />
      </label>
      <label className="block text-xs tracking-[0.16em] uppercase text-muted">
        Instagram
        <input
          name="instagramHandle"
          defaultValue={instagramHandle}
          placeholder="optional"
          className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base text-ink outline-none"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-ink px-5 py-3 text-xs tracking-[0.18em] text-ivory uppercase"
      >
        {pending ? "Saving…" : "Save profile"}
      </button>
      {message ? <p className="text-sm text-muted">{message}</p> : null}
    </form>
  );
}
