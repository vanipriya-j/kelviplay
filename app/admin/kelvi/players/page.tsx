import { prisma } from "@/lib/db";
import { KELVI_SLUG } from "@/lib/game/scoring";

export const dynamic = "force-dynamic";

export default async function PlayersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const game = await prisma.game.findUnique({ where: { slug: KELVI_SLUG } });
  const players = await prisma.player.findMany({
    where: q
      ? {
          OR: [
            { displayName: { contains: q } },
            { email: { contains: q } },
            { city: { contains: q } },
          ],
        }
      : undefined,
    include: {
      gameStats: { where: { gameId: game?.id } },
    },
    orderBy: { createdAt: "desc" },
    take: 80,
  });

  return (
    <div>
      <h1 className="font-serif text-4xl">Players</h1>
      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search name, email, city"
          className="w-full max-w-md border-b border-rule bg-transparent py-2 outline-none"
        />
      </form>
      <ul className="mt-8 divide-y divide-rule">
        {players.map((player) => {
          const stats = player.gameStats[0];
          return (
            <li key={player.id} className="flex justify-between py-3 text-sm">
              <div>
                <p className="font-serif text-lg">{player.displayName}</p>
                <p className="text-muted">
                  {player.city ?? "—"} {player.isGuest ? "· guest" : ""} {player.isAdmin ? "· admin" : ""}
                </p>
              </div>
              <div className="text-right text-muted">
                <p>🔥 {stats?.currentStreak ?? 0}</p>
                <p>{stats?.totalPlayed ?? 0} played</p>
                <p>{(stats?.totalScore ?? 0).toLocaleString("en-IN")} pts</p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
