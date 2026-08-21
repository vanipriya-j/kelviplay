"use server";

import { isMissingAuthSecret, playerIdForPlay } from "@/lib/play-session";

export async function enterAsGuestAction() {
  try {
    await playerIdForPlay();
    return { ok: true as const };
  } catch (error) {
    console.error("[kelvi] enter as guest failed", error);
    return {
      ok: false as const,
      error: isMissingAuthSecret(error)
        ? "Kelvi is missing AUTH_SECRET on this Vercel deployment."
        : "Could not open a guest seat. Try again.",
    };
  }
}
