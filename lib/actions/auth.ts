"use server";

import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { publicAppUrl } from "@/lib/app-url";
import { publicName } from "@/lib/utils";
import { setPlayerSessionCookie } from "@/lib/session-cookie";
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

export async function completeMagicLinkAction(token: string) {
  const link = await prisma.magicLink.findUnique({ where: { token } });
  if (!link || link.consumedAt || link.expiresAt < new Date()) {
    return { ok: false as const, error: "That link has expired. Request a new one." };
  }
  const displayName = link.displayName || link.email.split("@")[0];
  const existing = await prisma.player.findUnique({ where: { email: link.email } });
  const player =
    existing ??
    (await prisma.player.create({
      data: {
        email: link.email,
        emailVerified: new Date(),
        displayName: publicName(displayName, "Player"),
        name: displayName,
        isGuest: false,
      },
    }));
  if (existing?.isGuest) {
    await prisma.player.update({
      where: { id: existing.id },
      data: { isGuest: false, emailVerified: new Date() },
    });
  }
  await prisma.magicLink.update({
    where: { id: link.id },
    data: { consumedAt: new Date(), playerId: player.id },
  });
  await setPlayerSessionCookie({ ...player, isGuest: false });
  return { ok: true as const };
}

export async function enterDemoAction(demoKey: string) {
  const demoEnabled =
    process.env.AUTH_DEMO === "true" || process.env.NODE_ENV !== "production";
  if (!demoEnabled) {
    return { ok: false as const, error: "Demo seats are off." };
  }
  const player = await prisma.player.findFirst({
    where:
      demoKey === "admin"
        ? { isAdmin: true }
        : { displayName: demoKey, isGuest: false },
  });
  if (!player) {
    return { ok: false as const, error: "That demo seat is not seeded." };
  }
  await setPlayerSessionCookie(player);
  return { ok: true as const };
}

export async function signOutAction() {
  const { clearSessionCookies } = await import("@/lib/session-cookie");
  await clearSessionCookies();
}
