"use client";

import { useRouter } from "next/navigation";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={async () => {
        await signOutAction();
        router.replace("/play");
        router.refresh();
      }}
      className="text-xs tracking-[0.16em] uppercase text-muted"
    >
      Sign out
    </button>
  );
}
