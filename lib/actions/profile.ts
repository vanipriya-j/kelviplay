"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const profileSchema = z.object({
  displayName: z.string().min(2).max(24),
  city: z.string().max(40).optional(),
  instagramHandle: z.string().max(40).optional(),
});

export async function updateProfileAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Sign in first." };
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, error: "Check your details." };

  const handle = parsed.data.instagramHandle?.replace(/^@/, "").trim() || null;
  if (parsed.data.displayName.includes("@")) {
    return { ok: false as const, error: "Use a public name, not an email." };
  }

  await prisma.player.update({
    where: { id: session.user.id },
    data: {
      displayName: parsed.data.displayName.trim(),
      name: parsed.data.displayName.trim(),
      city: parsed.data.city?.trim() || null,
      instagramHandle: handle,
    },
  });
  revalidatePath("/play/profile");
  return { ok: true as const };
}
