import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { buildShareCard, pickShareVariant, type ShareVariant } from "@/lib/share/payload";
import { publicName } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const attemptId = request.nextUrl.searchParams.get("attemptId");
  const variantParam = request.nextUrl.searchParams.get("variant") as ShareVariant | null;
  if (!attemptId) {
    return new Response("Missing attempt", { status: 400 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      player: { select: { displayName: true } },
      question: { select: { number: true } },
    },
  });
  if (!attempt?.submittedAt || !attempt.correct) {
    return new Response("Not shareable", { status: 404 });
  }

  const correctCount = await prisma.attempt.count({
    where: {
      questionId: attempt.questionId,
      correct: true,
      submittedAt: { not: null },
      responseMs: { not: null },
    },
  });
  const faster = await prisma.attempt.count({
    where: {
      questionId: attempt.questionId,
      correct: true,
      submittedAt: { not: null },
      responseMs: { lt: attempt.responseMs ?? Number.MAX_SAFE_INTEGER },
    },
  });
  const rank = faster + 1;
  const stats = await prisma.playerGameStats.findFirst({
    where: { playerId: attempt.playerId },
  });

  const variant =
    variantParam ??
    pickShareVariant({
      correct: true,
      rank,
      recentAchievementCodes: rank === 1 ? ["FASTEST_FINGERS"] : [],
    });

  const card = buildShareCard({
    variant,
    kelviNumber: attempt.question.number,
    displayName: publicName(attempt.player.displayName),
    responseMs: attempt.responseMs,
    rank: correctCount ? rank : null,
    streak: stats?.currentStreak ?? 0,
    isFastest: rank === 1,
  });

  const qr = await QRCode.toDataURL(card.url, {
    margin: 0,
    width: 280,
    color: { dark: "#1c1915", light: "#f3ede2" },
  });

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1920,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#f3ede2",
          color: "#1c1915",
          padding: "120px 88px 100px",
          fontFamily: "Georgia, Times New Roman, serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 22, letterSpacing: 12, textTransform: "uppercase", color: "#6a6358" }}>
            AARLA PLAY
          </div>
          {card.kelviNumber ? (
            <div style={{ marginTop: 18, fontSize: 28, letterSpacing: 8 }}>KELVI #{card.kelviNumber}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {card.variant === "weekly" ? <div style={{ fontSize: 80 }}>🏆</div> : null}
          {card.variant === "streak" ? <div style={{ fontSize: 80 }}>🔥</div> : null}
          {card.variant === "fastest" ? (
            <div style={{ fontSize: 42, letterSpacing: 8 }}>FASTEST FINGERS ⚡</div>
          ) : null}
          {card.variant === "result" ? (
            <div style={{ fontSize: 42, letterSpacing: 6 }}>⚡ {card.responseSeconds} SEC</div>
          ) : (
            <div style={{ marginTop: 24, fontSize: 92, lineHeight: 1 }}>{card.headline}</div>
          )}
          {card.variant === "result" ? (
            <div style={{ marginTop: 28, fontSize: 120, lineHeight: 1 }}>{card.rankLabel}</div>
          ) : (
            <div style={{ marginTop: 24, fontSize: 48, letterSpacing: 2 }}>{card.subhead}</div>
          )}
          {card.variant === "result" && card.streak != null ? (
            <div style={{ marginTop: 48, fontSize: 40 }}>🔥 {card.streak} STREAK</div>
          ) : null}
          {card.rankLabel && card.variant === "fastest" ? (
            <div style={{ marginTop: 20, fontSize: 36 }}>{card.rankLabel}</div>
          ) : null}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 34, letterSpacing: 4 }}>{card.cta}</div>
            <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 6 }}>{card.handle}</div>
            <div style={{ marginTop: 10, fontSize: 20, color: "#6a6358" }}>{card.url}</div>
          </div>
          <img src={qr} width={180} height={180} alt="" />
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
