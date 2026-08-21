"use server";

import { auth } from "@/lib/auth";
import { ensureGuestPlayerId } from "@/lib/session-cookie";

export async function enterAsGuestAction() {
  const session = await auth();
  try {
    await ensureGuestPlayerId(session?.user?.id);
    return { ok: true as const };
  } catch (error) {
    console.error("[kelvi] enter as guest failed", error);
    return { ok: false as const, error: "Could not open a guest seat. Try again." };
  }
}
