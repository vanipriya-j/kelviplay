import { NextRequest } from "next/server";
import { expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({ prisma: {} }));
vi.mock("@/lib/game/daily-winners", () => ({
  getDailyWinners: async () => ({ dayKey: "2026-09-16", podium: [], fastest: null }),
}));

it("renders the completed daily winner card as a PNG even on a day with no winners", async () => {
  const { GET } = await import("@/app/api/share/daily/route");
  const response = await GET(new NextRequest("https://play.aarla.com/api/share/daily?day=2026-09-16"));
  expect(response.status).toBe(200);
  const bytes = new Uint8Array(await response.arrayBuffer());
  expect([...bytes.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
});
