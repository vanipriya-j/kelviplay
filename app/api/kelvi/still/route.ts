import { NextRequest } from "next/server";
import { loadKelviStill } from "@/lib/catalog/load-still";
import { bundledStillPath } from "@/lib/catalog/stills";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const number = Number(request.nextUrl.searchParams.get("number"));
  const side = request.nextUrl.searchParams.get("side") === "answer" ? "answer" : "question";
  const bundled = bundledStillPath(number, side);
  if (bundled) return new Response(null, { status: 307, headers: { Location: bundled } });
  try {
    const still = await loadKelviStill(number, side);
    if (!still) return new Response(null, { status: 404 });
    return new Response(Buffer.from(still.bytes), {
      headers: {
        "Content-Type": still.contentType,
        "Cache-Control": "public, max-age=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[kelvi] still load failed", error);
    return new Response(null, { status: 404 });
  }
}
