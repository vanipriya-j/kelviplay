import { NextRequest } from "next/server";
import QRCode from "qrcode";
import sharp from "sharp";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getDailyWinners } from "@/lib/game/daily-winners";
import { isWinnersBoardPublic, latestCompletedDay, parseIstDayKey } from "@/lib/game/rhythm";
import { buildDailyWinnersCard, type DailyWinnersCard } from "@/lib/share/daily-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const now = new Date();
  const dayParam = request.nextUrl.searchParams.get("day");
  const dayStart = dayParam ? parseIstDayKey(dayParam) : latestCompletedDay(now);
  if (!dayStart) return new Response("Invalid day", { status: 400 });

  const released = isWinnersBoardPublic(dayStart, now);
  if (!released) {
    const preview = request.nextUrl.searchParams.get("preview") === "1";
    const session = preview ? await auth() : null;
    if (!session?.user?.isAdmin) {
      return new Response("Daily winners go up at midnight IST", { status: 425 });
    }
  }

  try {
    const winners = await getDailyWinners(prisma, dayStart);
    const card = buildDailyWinnersCard({
      dayKey: winners.dayKey,
      dayStart,
      podium: winners.podium,
      fastest: winners.fastest,
    });
    const image = await sharp(Buffer.from(dailyCardSvg(card))).png().toBuffer();
    return new Response(Uint8Array.from(image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": released ? "public, max-age=60" : "private, no-store",
      },
    });
  } catch (error) {
    console.error("[kelvi] daily card render failed", error);
    return new Response("Could not render the winners card", { status: 500 });
  }
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[character] ?? character));
}

function dailyCardSvg(card: DailyWinnersCard) {
  const text = (value: string, x: number, y: number, size: number, muted = false) =>
    `<text x="${x}" y="${y}" font-size="${size}" fill="${muted ? "#6a6358" : "#1c1915"}">${escapeXml(value)}</text>`;
  const { modules } = QRCode.create(card.url, { errorCorrectionLevel: "M" });
  const margin = 4;
  const scale = 184 / (modules.size + margin * 2);
  const qr = [];
  for (let row = 0; row < modules.size; row++) {
    for (let col = 0; col < modules.size; col++) {
      if (modules.get(row, col)) qr.push(`M${col + margin},${row + margin}h1v1h-1z`);
    }
  }
  const winners = card.podium.map((row, index) => {
    const y = 690 + index * 176;
    return [
      text(`#${row.rank}`, 88, y, 26, true),
      text([...row.displayName].slice(0, 24).join(""), 88, y + 68, 47),
      text(`${row.points.toLocaleString("en-IN")} pts`, 790, y + 68, 28),
      `<path d="M88 ${y + 104}h904" stroke="#d8d0c0" />`,
    ].join("");
  }).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="#f3ede2"/>
    <g font-family="serif">
      ${text("AARLA PLAY", 88, 160, 33, true)}
      ${text("KELVI", 88, 233, 46)}
      ${text("DAILY WINNERS", 88, 385, 76)}
      ${text(card.subhead, 88, 470, 30, true)}
      <path d="M88 550h904" stroke="#d8d0c0" stroke-width="3"/>
      ${winners || text("No winners this day.", 88, 740, 46)}
      ${card.fastestName ? text("FASTEST FINGERS", 88, 1365, 28, true) : ""}
      ${card.fastestName ? text(`${card.fastestName} · ${card.fastestSeconds}s`, 88, 1420, 36) : ""}
      ${text(card.cta, 88, 1680, 43)}
      ${text(card.handles.join("  "), 88, 1737, 24, true)}
      ${text(card.url, 88, 1785, 26, true)}
    </g>
    <rect x="807" y="1618" width="184" height="184" fill="#f3ede2" />
    <path transform="translate(807 1618) scale(${scale})" d="${qr.join("")}" fill="#1c1915" shape-rendering="crispEdges"/>
  </svg>`;
}
