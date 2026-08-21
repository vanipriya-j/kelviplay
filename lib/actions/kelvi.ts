"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GameError, openKelvi, submitKelvi } from "@/lib/game/engine";
import { ensureGuestPlayerId } from "@/lib/session-cookie";
import { z } from "zod";

const submitSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(280),
  clientOpenedAt: z.string().optional(),
  clientSubmittedAt: z.string().optional(),
});

export async function playNowAction() {
  const session = await auth();
  await ensureGuestPlayerId(session?.user?.id);
}

export async function openLiveKelviAction(venueId?: string) {
  const session = await auth();
  let playerId: string;
  try {
    playerId = await ensureGuestPlayerId(session?.user?.id);
  } catch (error) {
    console.error("[kelvi] guest session failed", error);
    return {
      ok: false as const,
      code: "UNAUTHENTICATED",
      message: "Could not open a guest seat. Try again.",
    };
  }
  try {
    const opened = await openKelvi(prisma, {
      playerId,
      venueId,
    });
    return { ok: true as const, opened };
  } catch (error) {
    if (error instanceof GameError) {
      return { ok: false as const, code: error.code, message: error.message };
    }
    console.error("[kelvi] open live failed", error);
    return {
      ok: false as const,
      code: "UNAVAILABLE",
      message: "Could not open this Kelvi. Try again.",
    };
  }
}

export async function submitKelviAction(input: unknown) {
  const session = await auth();
  const playerId = session?.user?.id;
  if (!playerId) {
    return {
      ok: false as const,
      code: "UNAUTHENTICATED",
      message: "Your seat dropped. Open the Kelvi again.",
    };
  }
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID" };
  }
  try {
    const result = await submitKelvi(prisma, {
      playerId,
      ...parsed.data,
    });
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof GameError) {
      return { ok: false as const, code: error.code, message: error.message };
    }
    console.error("[kelvi] submit failed", error);
    return {
      ok: false as const,
      code: "UNAVAILABLE",
      message: "Could not lock that in. Try again.",
    };
  }
}
