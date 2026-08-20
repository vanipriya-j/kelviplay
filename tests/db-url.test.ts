import { describe, expect, it } from "vitest";
import {
  isPostgresUrl,
  normalizeDatabaseUrlForRuntime,
  resolvePrismaClientUrl,
} from "@/lib/db-url";

describe("Aarla OS supabase URL", () => {
  it("adds pgbouncer on the transaction pooler port", () => {
    const url =
      "postgresql://postgres.abc:secret@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";
    const next = normalizeDatabaseUrlForRuntime(url);
    expect(next).toContain("pgbouncer=true");
    expect(next).toContain("sslmode=require");
  });

  it("rewrites session pooler to transaction mode on Vercel", () => {
    const prev = process.env.VERCEL;
    process.env.VERCEL = "1";
    try {
      const url =
        "postgresql://postgres.abc:secret@aws-0-ap-south-1.pooler.supabase.com:5432/postgres";
      const next = normalizeDatabaseUrlForRuntime(url);
      expect(next).toContain(":6543/");
      expect(next).toContain("pgbouncer=true");
      expect(next).toContain("connection_limit=1");
    } finally {
      process.env.VERCEL = prev;
    }
  });

  it("rejects sqlite-shaped URLs", () => {
    expect(isPostgresUrl("file:./dev.db")).toBe(false);
    expect(isPostgresUrl("postgresql://localhost:5432/postgres")).toBe(true);
  });

  it("uses a placeholder client URL when DATABASE_URL is sqlite", () => {
    const prev = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "file:./dev.db";
    try {
      expect(resolvePrismaClientUrl()).toContain("127.0.0.1");
    } finally {
      process.env.DATABASE_URL = prev;
    }
  });
});
