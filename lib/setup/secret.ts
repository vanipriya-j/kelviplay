import { timingSafeEqual } from "crypto";

/** Same idea as Aarla OS `/setup`. AUTH_SECRET is already on kelviplay Vercel. */
export function setupSecret(): string | null {
  return process.env.SETUP_SECRET?.trim() || process.env.AUTH_SECRET?.trim() || null;
}

export function setupSecretMatches(provided: string): boolean {
  const expected = setupSecret();
  if (!expected || !provided) return false;
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
