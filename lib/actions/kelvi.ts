"use server";

import { auth, signIn } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GameError, openKelvi, submitKelvi } from "@/lib/game/engine";
import { z } from "zod";

const submitSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(280),
  clientOpenedAt: z.string().optional(),
  clientSubmittedAt: z.string().optional(),
});

export async function playNowAction() {
  const session = await auth();
  if (!session?.user?.id) {
    await signIn("kelvi", { kind: "guest", redirect: false });
  }
}

export async function openLiveKelviAction(venueId?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, code: "UNAUTHENTICATED" };
  }
  try {
    const opened = await openKelvi(prisma, {
      playerId: session.user.id,
      venueId,
    });
    return { ok: true as const, opened };
  } catch (error) {
    if (error instanceof GameError) {
      return { ok: false as const, code: error.code, message: error.message };
    }
    throw error;
  }
}

export async function submitKelviAction(input: unknown) {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false as const, code: "UNAUTHENTICATED" };
  }
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID" };
  }
  try {
    const result = await submitKelvi(prisma, {
      playerId: session.user.id,
      ...parsed.data,
    });
    return { ok: true as const, ...result };
  } catch (error) {
    if (error instanceof GameError) {
      return { ok: false as const, code: error.code, message: error.message };
    }
    throw error;
  }
}
