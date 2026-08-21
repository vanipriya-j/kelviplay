"use server";

import { prisma } from "@/lib/db";
import { GameError, openKelvi, submitKelvi } from "@/lib/game/engine";
import { existingPlayerId, isMissingAuthSecret, playerIdForPlay } from "@/lib/play-session";
import { z } from "zod";

const submitSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(280),
  clientOpenedAt: z.string().optional(),
  clientSubmittedAt: z.string().optional(),
});

export async function playNowAction() {
  try {
    await playerIdForPlay();
    return { ok: true as const };
  } catch (error) {
    console.error("[kelvi] play now failed", error);
    return {
      ok: false as const,
      error: isMissingAuthSecret(error)
        ? "Kelvi is missing AUTH_SECRET on this Vercel deployment."
        : "Could not open this Kelvi. Try again.",
    };
  }
}

export async function openLiveKelviAction(venueId?: string) {
  let playerId: string;
  try {
    playerId = await playerIdForPlay();
  } catch (error) {
    console.error("[kelvi] guest session failed", error);
    return {
      ok: false as const,
      code: "UNAUTHENTICATED",
      message: isMissingAuthSecret(error)
        ? "Kelvi is missing AUTH_SECRET on this Vercel deployment."
        : "Could not open a guest seat. Try again.",
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
  const playerId = await existingPlayerId();
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
