import { prisma } from "@/lib/db";
import { getHomeState } from "@/lib/game/home";
import { existingPlayerId } from "@/lib/play-session";
import { KelviHome } from "@/components/kelvi/KelviHome";

export const dynamic = "force-dynamic";

export default async function KelviHomePage() {
  const playerId = await existingPlayerId();
  const state = await getHomeState(prisma, playerId);
  return <KelviHome initial={state} />;
}
