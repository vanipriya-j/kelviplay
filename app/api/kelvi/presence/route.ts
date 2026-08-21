import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { heartbeatPresence } from "@/lib/game/engine";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (!rateLimit(`presence:${session.user.id}`, 20, 60_000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }
  const body = await request.json().catch(() => null);
  const parsed = z.object({ questionId: z.string().min(1) }).safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    await heartbeatPresence(prisma, {
      questionId: parsed.data.questionId,
      playerId: session.user.id,
    });
  } catch (error) {
    console.error("[kelvi] presence failed", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
