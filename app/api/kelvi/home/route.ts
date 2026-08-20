import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getHomeState } from "@/lib/game/home";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  const state = await getHomeState(prisma, session?.user?.id);
  return NextResponse.json(state);
}
