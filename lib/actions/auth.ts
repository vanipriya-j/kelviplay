"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { publicAppUrl } from "@/lib/app-url";
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

  const origin = publicAppUrl();
  if (!origin) {
    return { ok: false as const, error: "Set NEXT_PUBLIC_APP_URL so Kelvi can build a sign-in link." };
  }

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  try {
    await prisma.magicLink.create({
      data: {
        email: parsed.data.email.toLowerCase().trim(),
        displayName: parsed.data.displayName.trim(),
        token,
        expiresAt,
      },
    });
  } catch (error) {
    console.error("[kelvi] magic link create failed", error);
    return { ok: false as const, error: "Could not start email sign-in. Try Play as guest." };
  }

  const url = `${origin}/auth/verify?token=${token}`;
  console.info("[kelvi] magic link", parsed.data.email, url);

  return {
    ok: true as const,
    previewUrl: url,
  };
}
