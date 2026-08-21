"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { resolveDirectUrl } from "@/lib/db-url";
import { applyKelviSchema } from "@/lib/setup/apply";
import { setupSecretMatches } from "@/lib/setup/secret";
import { seedKelvi } from "@/prisma/seed";

export async function initializeKelviAction(formData: FormData): Promise<{
  ok: boolean;
  message: string;
}> {
  const secret = String(formData.get("secret") ?? "");
  const reloadDemo = formData.get("reloadDemo") === "on";

  if (!setupSecretMatches(secret)) {
    return { ok: false, message: "That setup secret did not match." };
  }

  const db = new PrismaClient({
    datasources: { db: { url: resolveDirectUrl() } },
  });

  try {
    const schema = await applyKelviSchema(db);
    const existing = await db.game.findUnique({ where: { slug: "kelvi" } });
    if (!existing || reloadDemo) {
      await seedKelvi(db);
    }
    revalidatePath("/play/kelvi");
    revalidatePath("/play");
    return {
      ok: true,
      message: existing && !reloadDemo
        ? schema.created
          ? "Schema kelvi is ready. Questions were already there."
          : "Kelvi is already set up on Aarla OS."
        : "Schema kelvi is ready and seeded. Public Aarla OS tables were not touched.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Setup failed.";
    return { ok: false, message };
  } finally {
    await db.$disconnect();
  }
}
