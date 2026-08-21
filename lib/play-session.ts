import { auth } from "./auth";
import { ensureGuestPlayerId, sessionFromCookie } from "./session-cookie";

export async function playerIdForPlay() {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch (error) {
    console.error("[kelvi] auth() failed", error);
  }
  return ensureGuestPlayerId();
}

export async function existingPlayerId() {
  try {
    const session = await auth();
    if (session?.user?.id) return session.user.id;
  } catch (error) {
    console.error("[kelvi] auth() failed", error);
  }
  const fromCookie = await sessionFromCookie();
  return fromCookie?.user.id ?? null;
}

export function isMissingAuthSecret(error: unknown) {
  return error instanceof Error && /AUTH_SECRET/i.test(error.message);
}
