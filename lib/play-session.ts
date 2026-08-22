import { ensureGuestPlayerId, sessionFromCookie } from "./session-cookie";

/** Fast path for pages: decode the JWT cookie. Do not call Auth.js. */
export async function existingPlayerId() {
  const fromCookie = await sessionFromCookie();
  return fromCookie?.user.id ?? null;
}

export async function playerIdForPlay() {
  return ensureGuestPlayerId();
}

export function isMissingAuthSecret(error: unknown) {
  return error instanceof Error && /AUTH_SECRET/i.test(error.message);
}
