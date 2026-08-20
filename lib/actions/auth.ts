"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { z } from "zod";

const requestSchema = z.object({
  email: z.string().email(),
  displayName: z.string().min(2).max(24),
});

export async function requestMagicLinkAction(input: unknown) {
  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: "Enter a valid email and display name." };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  await prisma.magicLink.create({
    data: {
      email: parsed.data.email.toLowerCase().trim(),
      displayName: parsed.data.displayName.trim(),
      token,
      expiresAt,
    },
  });

  const url = `${process.env.AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ""}/auth/verify?token=${token}`;
  console.info("[kelvi] magic link", parsed.data.email, url);

  return {
    ok: true as const,
    previewUrl:
      process.env.AUTH_DEMO === "true" || process.env.NODE_ENV !== "production"
        ? url
        : undefined,
  };
}
