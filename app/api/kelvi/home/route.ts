import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getHomeState } from "@/lib/game/home";
import { existingPlayerId } from "@/lib/play-session";

export const dynamic = "force-dynamic";

export async function GET() {
  const playerId = await existingPlayerId();
  const state = await getHomeState(prisma, playerId);
  return NextResponse.json(state);
}
