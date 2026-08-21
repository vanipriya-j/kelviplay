/**
 * Public origin for magic links and redirects.
 * Do not use AUTH_URL when it is localhost or the Auth.js API path —
 * that is a common Vercel leftover and makes sign-in report Configuration.
 */
import { authSecret, runtimeEnv } from "./runtime-env";

export function publicAppUrl(): string {
  const nextPublic = stripSlash(runtimeEnv("NEXT_PUBLIC_APP_URL"));
  if (nextPublic && !isUnusableOrigin(nextPublic)) return nextPublic;

  const productionHost = runtimeEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (productionHost) {
    return `https://${productionHost.replace(/\/$/, "")}`;
  }

  const vercelUrl = runtimeEnv("VERCEL_URL");
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  const authUrl = stripSlash(runtimeEnv("AUTH_URL") || runtimeEnv("NEXTAUTH_URL"));
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
  process.env["AUTH_TRUST_HOST"] = "true";
  authSecret();

  const current = runtimeEnv("AUTH_URL") || runtimeEnv("NEXTAUTH_URL");
  if (current && isUnusableOrigin(current)) {
    delete process.env["AUTH_URL"];
    delete process.env["NEXTAUTH_URL"];
  }

  const onVercel = runtimeEnv("VERCEL") === "1";
  const authUrl = runtimeEnv("AUTH_URL");
  if (onVercel && (!authUrl || isUnusableOrigin(authUrl))) {
    const origin = publicAppUrl();
    if (origin) process.env["AUTH_URL"] = origin;
  }
}

function stripSlash(url?: string): string {
  return (url ?? "").trim().replace(/\/$/, "");
}
