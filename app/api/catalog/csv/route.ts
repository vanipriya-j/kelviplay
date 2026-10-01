import { auth } from "@/lib/auth";
import { catalogCsv, listCatalogRows } from "@/lib/catalog/rows";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return new Response("Forbidden", { status: 403 });
  }

  const rows = await listCatalogRows(prisma);
  return new Response(catalogCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="kelvi-catalog.csv"',
      "Cache-Control": "no-store",
    },
  });
}
