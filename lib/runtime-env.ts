/**
 * Read an env var at request time.
 * Use `process.env[name]` so Next.js cannot inline AUTH_SECRET as empty
 * during `next build` (Vercel marks it Sensitive, so it is missing at build).
 */
export function runtimeEnv(name: string): string {
  const value = process.env[name];
  return typeof value === "string" ? value.trim() : "";
}

const SECRET_KEYS = ["AUTH_SECRET", "NEXTAUTH_SECRET", "SETUP_SECRET"] as const;

/** JWT / Auth.js secret. SETUP_SECRET is a last-resort Production fallback. */
export function authSecret(): string {
  for (const key of SECRET_KEYS) {
    const value = runtimeEnv(key);
    if (value) {
      if (key !== "AUTH_SECRET" && !runtimeEnv("AUTH_SECRET")) {
        process.env["AUTH_SECRET"] = value;
      }
      return value;
    }
  }
  return "";
}

export function missingAuthSecretMessage() {
  return "Enable AUTH_SECRET for Production in Vercel → Settings → Environment Variables, then Redeploy.";
}
