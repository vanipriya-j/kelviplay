/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import QRCode from "qrcode";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDailyWinners } from "@/lib/game/daily-winners";
import { isWinnersBoardPublic, parseIstDayKey, winnersBoardDay } from "@/lib/game/rhythm";
import { getDayStart } from "@/lib/game/time";
import { buildDailyWinnersCard } from "@/lib/share/daily-card";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET(request: NextRequest) {
  const now = new Date();
  const dayParam = request.nextUrl.searchParams.get("day");
  const dayStart = dayParam ? parseIstDayKey(dayParam) : (winnersBoardDay(now) ?? getDayStart(now));
  if (!dayStart) {
    return new Response("Invalid day", { status: 400 });
  }
  if (!isWinnersBoardPublic(dayStart, now)) {
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    const session = preview ? await auth() : null;
    if (!session?.user?.isAdmin) {
      return new Response("Tonight's winners go up at 10 PM", { status: 425 });
    }
  }

  const winners = await getDailyWinners(prisma, dayStart);
  const card = buildDailyWinnersCard({
    dayKey: winners.dayKey,
    dayStart,
    podium: winners.podium,
    fastest: winners.fastest,
  });

  const qr = await QRCode.toDataURL(card.url, {
    margin: 0,
    width: 280,
    color: { dark: "#1c1915", light: "#f3ede2" },
  });

  const medals = ["1", "2", "3"];
  const podium =
    card.podium.length > 0 ? (
      <div style={{ display: "flex", flexDirection: "column" }}>
        {card.podium.map((row, index) => (
          <div
            key={`${row.rank}-${row.displayName}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: index === 0 ? 0 : 28,
            }}
          >
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 22, letterSpacing: 8, color: "#6a6358" }}>{`#${medals[index] ?? row.rank}`}</div>
              <div style={{ marginTop: 8, fontSize: 56, lineHeight: 1 }}>{row.displayName}</div>
            </div>
            <div style={{ fontSize: 36, letterSpacing: 2 }}>{row.points.toLocaleString("en-IN")}</div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 48, lineHeight: 1.2 }}>No winners tonight.</div>
        <div style={{ marginTop: 24, fontSize: 32, color: "#6a6358" }}>Come play tomorrow.</div>
      </div>
    );

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
          <div style={{ fontSize: 22, letterSpacing: 12, color: "#6a6358" }}>AARLA PLAY</div>
          <div style={{ marginTop: 18, fontSize: 28, letterSpacing: 8 }}>KELVI</div>
          <div style={{ marginTop: 48, fontSize: 92, lineHeight: 1 }}>{card.headline}</div>
          <div style={{ marginTop: 20, fontSize: 28, letterSpacing: 4, color: "#6a6358" }}>{card.subhead}</div>
        </div>
        {podium}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {card.fastestName ? (
            <div style={{ display: "flex", flexDirection: "column", marginBottom: 48 }}>
              <div style={{ fontSize: 22, letterSpacing: 8, color: "#6a6358" }}>FASTEST FINGERS</div>
              <div style={{ marginTop: 10, fontSize: 40 }}>
                {`${card.fastestName}${card.fastestSeconds ? ` · ${card.fastestSeconds}s` : ""}`}
              </div>
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 34, letterSpacing: 4 }}>{card.cta}</div>
              <div style={{ marginTop: 18, fontSize: 22, letterSpacing: 4 }}>{card.handles.join("  ")}</div>
              <div style={{ marginTop: 10, fontSize: 20, color: "#6a6358" }}>{card.cadence}</div>
              <div style={{ marginTop: 8, fontSize: 20, color: "#6a6358" }}>{card.url}</div>
            </div>
            <img src={qr} width={180} height={180} alt="" />
          </div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
