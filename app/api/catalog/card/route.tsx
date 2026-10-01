import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { CatalogPosterImage } from "@/lib/catalog/render-poster";
import { buildCatalogPoster } from "@/lib/catalog/poster";
import { prisma } from "@/lib/db";
import { KELVI_SLUG } from "@/lib/game/scoring";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const number = Number(request.nextUrl.searchParams.get("number"));
  if (!Number.isInteger(number) || number < 1) {
    return new Response("Missing number", { status: 400 });
  }

  const question = await prisma.question.findFirst({
    where: { number, game: { slug: KELVI_SLUG } },
    include: { category: { select: { name: true } } },
  });
  if (!question) return new Response("Not found", { status: 404 });

  const poster = buildCatalogPoster({
    number: question.number,
    title: question.internalTitle,
    question: question.questionText,
    category: question.category.name,
  });

  return new ImageResponse(<CatalogPosterImage poster={poster} />, {
    width: 1080,
    height: 1920,
  });
}
