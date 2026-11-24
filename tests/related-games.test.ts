import { describe, expect, it } from "vitest";
import {
  AARLA_PLAY_URL,
  AARLA_PLAY_URL_FALLBACK,
  isForbiddenRelatedGame,
  kelviRelatedGames,
} from "@/lib/related-games";

describe("Kelvi related games", () => {
  it("lists at most three solo short-session games", () => {
    const games = kelviRelatedGames();
    expect(games.length).toBeLessThanOrEqual(3);
    expect(games.map((game) => game.name)).toEqual(["Kolam Kraze", "Sabha Canteen"]);
  });

  it("does not list board games or the rest of the Play catalogue", () => {
    const names = kelviRelatedGames().map((game) => game.name);
    for (const name of names) {
      expect(isForbiddenRelatedGame(name)).toBe(false);
    }
    expect(names.join(" ")).not.toMatch(/Pallanguzhi|Aadu Puli|Sabha(?! Canteen)|Mouna|Maalai|Kattam/);
  });

  it("never uses local paths for related games", () => {
    for (const game of kelviRelatedGames()) {
      if (game.href) {
        expect(game.href.startsWith("https://")).toBe(true);
        expect(game.href.startsWith("/")).toBe(false);
      }
    }
  });

  it("sends the full catalogue off this host", () => {
    expect(AARLA_PLAY_URL).toBe("https://play.aarla.in");
    expect(AARLA_PLAY_URL_FALLBACK).toBe("https://aarla-play.vercel.app");
  });
});
