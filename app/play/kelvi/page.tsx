import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getHomeState } from "@/lib/game/home";
import { AppShell, BottomNav } from "@/components/layout/AppShell";
import { KelviHome } from "@/components/kelvi/KelviHome";

export const dynamic = "force-dynamic";

export default async function KelviHomePage() {
  const session = await auth();
  const state = await getHomeState(prisma, session?.user?.id);
  return (
    <AppShell footer={<BottomNav current="home" />}>
      <KelviHome initial={state} />
    </AppShell>
  );
}
