import { describe, expect, it } from "vitest";
import { splitSqlStatements } from "@/lib/setup/apply";
import { setupSecretMatches } from "@/lib/setup/secret";

describe("kelvi setup SQL", () => {
  it("splits statements and drops comment-only chunks", () => {
    const statements = splitSqlStatements(`
-- heading
CREATE SCHEMA IF NOT EXISTS kelvi;
CREATE TABLE "kelvi"."Game" (
  "id" TEXT NOT NULL
);
`);
    expect(statements).toEqual([
      "CREATE SCHEMA IF NOT EXISTS kelvi",
      `CREATE TABLE "kelvi"."Game" (\n  "id" TEXT NOT NULL\n)`,
    ]);
  });
});

describe("kelvi setup secret", () => {
  it("accepts AUTH_SECRET when SETUP_SECRET is unset", () => {
    const prevSetup = process.env.SETUP_SECRET;
    const prevAuth = process.env.AUTH_SECRET;
    delete process.env.SETUP_SECRET;
    process.env.AUTH_SECRET = "room-key";
    try {
      expect(setupSecretMatches("room-key")).toBe(true);
      expect(setupSecretMatches("wrong")).toBe(false);
    } finally {
      process.env.SETUP_SECRET = prevSetup;
      process.env.AUTH_SECRET = prevAuth;
    }
  });
});
