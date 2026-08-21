"use server";

import { isMissingAuthSecret, playerIdForPlay } from "@/lib/play-session";
import { missingAuthSecretMessage } from "@/lib/runtime-env";

export async function enterAsGuestAction() {
  try {
    await playerIdForPlay();
    return { ok: true as const };
  } catch (error) {
    console.error("[kelvi] enter as guest failed", error);
    return {
      ok: false as const,
      error: isMissingAuthSecret(error)
        ? missingAuthSecretMessage()
        : "Could not open a guest seat. Try again.",
    };
  }
}
