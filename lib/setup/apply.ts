import type { PrismaClient } from "@prisma/client";
import { KELVI_DDL } from "./kelvi-ddl";

export function splitSqlStatements(sql: string): string[] {
  return sql
    .split(/;\s*(?:\n|$)/)
    .map((chunk) =>
      chunk
        .split("\n")
        .map((line) => line.replace(/^\s*--.*$/, ""))
        .join("\n")
        .trim(),
    )
    .filter((statement) => statement.length > 0);
}

export function loadKelviDdl(): string {
  return KELVI_DDL;
}

export async function kelviGameTableExists(db: PrismaClient): Promise<boolean> {
  const rows = await db.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'kelvi'
        AND table_name = 'Game'
    ) AS exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function applyKelviSchema(db: PrismaClient): Promise<{ created: boolean }> {
  await db.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS kelvi`);
  if (await kelviGameTableExists(db)) {
    return { created: false };
  }
  for (const statement of splitSqlStatements(loadKelviDdl())) {
    try {
      await db.$executeRawUnsafe(statement);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/already exists/i.test(message)) continue;
      throw error;
    }
  }
  return { created: true };
}
