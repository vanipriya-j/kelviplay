import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { countPlaying, getLiveHeadline, heartbeatPresence } from "@/lib/game/engine";
import { existingPlayerId } from "@/lib/play-session";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const playerId = await existingPlayerId();
  if (!playerId) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!rateLimit(`presence:${playerId}`, 20, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = z.object({ questionId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const live = await getLiveHeadline(prisma);
    if (!live || live.id !== parsed.data.questionId) {
      return NextResponse.json({ ok: false }, { status: 404 });
    }
    await heartbeatPresence(prisma, {
      questionId: parsed.data.questionId,
      playerId,
    });
    const playingCount = await countPlaying(prisma, live.id);
    return NextResponse.json({ ok: true, playingCount });
  } catch (error) {
    console.error("[kelvi] presence failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
