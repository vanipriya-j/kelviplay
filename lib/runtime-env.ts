/**
 * Read an env var at request time.
 * Use `process.env[name]` so Next.js cannot inline AUTH_SECRET as empty
 * during `next build` (Vercel marks it Sensitive, so it is missing at build).
 */
export function runtimeEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

export function authSecret(): string {
  return runtimeEnv("AUTH_SECRET") || runtimeEnv("NEXTAUTH_SECRET");
}
