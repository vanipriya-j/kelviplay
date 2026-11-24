/** Full Aarla Play catalogue — not this Kelvi host. */
export const AARLA_PLAY_URL = "https://play.aarla.in";
export const AARLA_PLAY_URL_FALLBACK = "https://aarla-play.vercel.app";

export type RelatedGame = {
  name: string;
  line: string;
  /** Full https URL when the game has its own host. Never a local path. */
  href: string | null;
};

/** Solo short-session games related to Kelvi. Coming-soon cards stay inert. */
export const KELVI_RELATED_GAMES: RelatedGame[] = [
  {
    name: "Kolam Kraze",
    line: "Pattern, memory, quiet speed.",
    href: null,
  },
  {
    name: "Sabha Canteen",
    line: "Filter coffee, hierarchy, gossip.",
    href: null,
  },
];

const FORBIDDEN_ON_KELVI_HOME = [
  "Pallanguzhi",
  "Aadu Puli Aattam",
  "Aarla Sabha",
  "Mouna Mozhi",
  "Maalai Rush",
  "Kattam Kattam",
];

export function aarlaPlayCatalogUrl() {
  return process.env.NEXT_PUBLIC_AARLA_PLAY_URL?.trim() || AARLA_PLAY_URL;
}

export function kelviRelatedGames() {
  return KELVI_RELATED_GAMES.slice(0, 3);
}

export function isForbiddenRelatedGame(name: string) {
  return FORBIDDEN_ON_KELVI_HOME.includes(name);
}
