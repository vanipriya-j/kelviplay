/**
 * Public origin for magic links and redirects.
 * Do not use AUTH_URL when it is localhost or the Auth.js API path —
 * that is a common Vercel leftover and makes sign-in report Configuration.
 */
export function publicAppUrl(): string {
  const nextPublic = stripSlash(process.env.NEXT_PUBLIC_APP_URL);
  if (nextPublic && !isUnusableOrigin(nextPublic)) return nextPublic;

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

/** Auth.js reads AUTH_URL from the environment. A bad value breaks Vercel sign-in. */
export function ignoreStaleAuthUrl() {
  if (process.env.VERCEL === "1") {
    delete process.env.AUTH_URL;
    return;
  }
  const url = process.env.AUTH_URL?.trim() ?? "";
  if (url && isUnusableOrigin(url)) {
    delete process.env.AUTH_URL;
  }
}

function stripSlash(url?: string): string {
  return (url ?? "").trim().replace(/\/$/, "");
}
