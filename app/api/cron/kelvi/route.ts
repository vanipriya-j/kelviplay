import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { announceDailyWinners } from "@/lib/game/broadcast";
import { runtimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  return runCron(request);
}

export async function POST(request: NextRequest) {
  return runCron(request);
}

async function runCron(request: NextRequest) {
  if (!authorizeCron(request)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await announceDailyWinners(prisma);
    return NextResponse.json(result);
  } catch (error) {
    console.error("[kelvi] daily winners cron failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Cron failed" },
      { status: 500 },
    );
  }
}

function authorizeCron(request: NextRequest) {
  const secret = runtimeEnv("CRON_SECRET");
  if (!secret) {
    return runtimeEnv("VERCEL") !== "1";
  }
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}
