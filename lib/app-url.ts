/**
 * Public origin for magic links and redirects.
 * Do not use AUTH_URL when it is localhost or the Auth.js API path —
 * that is a common Vercel leftover and makes sign-in report Configuration.
 */
export function publicAppUrl(): string {
  const nextPublic = stripSlash(process.env.NEXT_PUBLIC_APP_URL);
  if (nextPublic && !isUnusableOrigin(nextPublic)) return nextPublic;

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, "")}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }

  const authUrl = stripSlash(process.env.AUTH_URL);
  if (authUrl && !isUnusableOrigin(authUrl)) return authUrl;

  return "";
}

export function isUnusableOrigin(url: string): boolean {
  return (
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    url.includes("/api/auth")
  );
}

/** Auth.js reads AUTH_URL / AUTH_TRUST_HOST from the environment. */
export function prepareAuthEnv() {
  process.env.AUTH_TRUST_HOST = "true";

  const current = process.env.AUTH_URL?.trim() ?? "";
  if (current && isUnusableOrigin(current)) {
    delete process.env.AUTH_URL;
  }

  if (process.env.VERCEL === "1" && (!process.env.AUTH_URL || isUnusableOrigin(process.env.AUTH_URL))) {
    const origin = publicAppUrl();
    if (origin) process.env.AUTH_URL = origin;
  }
}

function stripSlash(url?: string): string {
  return (url ?? "").trim().replace(/\/$/, "");
}
