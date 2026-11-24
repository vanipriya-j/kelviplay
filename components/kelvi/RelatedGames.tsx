import { aarlaPlayCatalogUrl, kelviRelatedGames } from "@/lib/related-games";

export function RelatedGames() {
  const games = kelviRelatedGames();
  const catalog = aarlaPlayCatalogUrl();

  return (
    <section className="mt-12 border-t border-rule pt-8">
      <p className="text-[11px] tracking-[0.22em] uppercase text-muted">Also in Aarla Play</p>
      <ul className="mt-4 grid gap-3">
        {games.map((game) => (
          <li key={game.name}>
            {game.href ? (
              <a
                href={game.href}
                target="_blank"
                rel="noreferrer"
                className="block rounded-2xl border border-rule px-4 py-4"
              >
                <p className="font-serif text-xl">{game.name}</p>
                <p className="mt-1 text-sm text-muted">{game.line}</p>
              </a>
            ) : (
              <div className="rounded-2xl border border-dashed border-rule px-4 py-4">
                <p className="font-serif text-xl text-ink/80">{game.name}</p>
                <p className="mt-1 text-sm text-muted">{game.line}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-5 text-sm">
        <a
          href={catalog}
          target="_blank"
          rel="noreferrer"
          className="text-ink underline decoration-rule underline-offset-4"
        >
          All games on Aarla Play →
        </a>
      </p>
    </section>
  );
}
