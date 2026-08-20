"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/play" })}
      className="text-xs tracking-[0.16em] uppercase text-muted"
    >
      Sign out
    </button>
  );
}
