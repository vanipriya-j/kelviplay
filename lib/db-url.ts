/**
 * Same connection rules as Aarla OS (`aarla-os` src/lib/infra/db/env.ts),
 * plus Prisma pooler flags. Kelvi talks to the Aarla OS Supabase Postgres,
 * isolated in the `kelvi` schema.
 */

const GENERATE_PLACEHOLDER =
  "postgresql://prisma:prisma@127.0.0.1:5432/postgres?schema=kelvi";

export function isPostgresUrl(url: string): boolean {
  return url.startsWith("postgres://") || url.startsWith("postgresql://");
}

export function resolveDatabaseUrl(): string {
  const url =
    process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim() || "";
  if (!url) {
    throw new Error(
      "DATABASE_URL (or SUPABASE_DB_URL) is not set. Use the Aarla OS Supabase Transaction pooler URI (port 6543).",
    );
  }
  if (!isPostgresUrl(url)) {
    throw new Error(
      "DATABASE_URL must be a Postgres URI for the Aarla OS Supabase project (not SQLite). See .env.example.",
    );
  }
  return normalizeDatabaseUrlForRuntime(url);
}

/**
 * Session / direct URI for Prisma CLI and seed. Do not rewrite to :6543.
 * Vercel only needs DATABASE_URL — DIRECT_URL is derived (6543 → 5432).
 */
export function resolveDirectUrl(): string {
  const explicit = process.env.DIRECT_URL?.trim();
  if (explicit) {
    if (!isPostgresUrl(explicit)) {
      throw new Error("DIRECT_URL must be a Postgres URI (session pooler, port 5432).");
    }
    return ensureSsl(explicit);
  }
  const raw =
    process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim() || "";
  if (!isPostgresUrl(raw)) {
    throw new Error(
      "DATABASE_URL (or SUPABASE_DB_URL) is not set. Use the Aarla OS Supabase pooler URI.",
    );
  }
  return deriveDirectUrl(raw);
}

/** Transaction pooler :6543 → session pooler :5432, drop Prisma runtime flags. */
export function deriveDirectUrl(databaseUrl: string): string {
  let next = databaseUrl.includes(":6543/")
    ? databaseUrl.replace(":6543/", ":5432/")
    : databaseUrl;
  next = stripQueryParam(next, "pgbouncer");
  next = stripQueryParam(next, "connection_limit");
  return ensureSsl(next);
}

/**
 * Prisma client URL for the running app. Falls back to a local placeholder so
 * `next build` / `prisma generate` can run before secrets are present.
 */
export function resolvePrismaClientUrl(): string {
  const raw =
    process.env.DATABASE_URL?.trim() || process.env.SUPABASE_DB_URL?.trim() || "";
  if (!isPostgresUrl(raw)) return GENERATE_PLACEHOLDER;
  return resolveDatabaseUrl();
}

export function normalizeDatabaseUrlForRuntime(url: string): string {
  let next = url;
  if (process.env.DATABASE_POOL_MODE === "session") {
    return ensureSsl(next);
  }
  if (process.env.DATABASE_POOL_MODE === "transaction" || process.env.VERCEL === "1") {
    next = forceTransactionPoolerPort(next);
  }
  next = ensurePgBouncer(next);
  if (process.env.VERCEL === "1") {
    next = ensureConnectionLimit(next);
  }
  return ensureSsl(next);
}

function forceTransactionPoolerPort(url: string): string {
  if (!url.includes("pooler.supabase.com")) return url;
  if (url.includes(":6543/")) return url;
  if (url.includes(":5432/")) return url.replace(":5432/", ":6543/");
  return url;
}

function ensurePgBouncer(url: string): string {
  if (!url.includes(":6543/")) return url;
  if (url.includes("pgbouncer=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}pgbouncer=true`;
}

function ensureConnectionLimit(url: string): string {
  if (url.includes("connection_limit=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}connection_limit=1`;
}

function ensureSsl(url: string): string {
  if (!isRemoteSupabaseUrl(url)) return url;
  if (url.includes("sslmode=")) return url;
  return `${url}${url.includes("?") ? "&" : "?"}sslmode=require`;
}

export function isRemoteSupabaseUrl(url: string): boolean {
  return (
    url.includes("supabase.co") ||
    url.includes("supabase.com") ||
    url.includes("pooler.supabase")
  );
}

function stripQueryParam(url: string, key: string): string {
  const re = new RegExp(`([?&])${key}=[^&]*`);
  let next = url.replace(re, "$1");
  next = next.replace(/[?&]&/g, "$1");
  next = next.replace(/[?&]$/, "");
  return next;
}
