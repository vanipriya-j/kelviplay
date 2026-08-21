/**
 * Run Prisma CLI against the session pooler when possible.
 * Vercel only has DATABASE_URL; derive :5432 from :6543 for db push / execute.
 */
import { spawnSync } from "node:child_process";
import { isPostgresUrl, resolveDirectUrl } from "../lib/db-url";

const env = { ...process.env };
const args = process.argv.slice(2);
const command = args[0] ?? "";
const raw = env.DATABASE_URL?.trim() || env.SUPABASE_DB_URL?.trim() || "";

if (command !== "generate" && (isPostgresUrl(raw) || env.DIRECT_URL?.trim())) {
  env.DATABASE_URL = resolveDirectUrl();
} else if (!isPostgresUrl(raw)) {
  env.DATABASE_URL =
    raw || "postgresql://prisma:prisma@127.0.0.1:5432/postgres?schema=kelvi";
}

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  env,
});
process.exit(result.status ?? 1);
