import { assertNoSpoilers } from "../share/payload";

export type CatalogPoster = {
  variant: "catalog";
  number: number;
  title: string;
  prompt: string;
  category: string;
  brand: string;
  handle: string;
};

const ANSWER_KEYS = ["answer", "correctAnswer", "acceptableAnswers", "options"] as const;

export function clipCatalogText(text: string, max: number) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

export function buildCatalogPoster(input: {
  number: number;
  title: string;
  question: string;
  category: string;
}): CatalogPoster {
  const poster: CatalogPoster = {
    variant: "catalog",
    number: input.number,
    title: clipCatalogText(input.title, 80),
    prompt: clipCatalogText(input.question, 280),
    category: clipCatalogText(input.category, 40),
    brand: "AARLA PLAY",
    handle: "@aarla.play",
  };
  assertCatalogPoster(poster);
  return poster;
}

/** Drive posters may show the question, never the answer. */
export function assertCatalogPoster(poster: CatalogPoster) {
  for (const key of ANSWER_KEYS) {
    if (Object.prototype.hasOwnProperty.call(poster, key)) {
      throw new Error(`Catalog poster leaked ${key}`);
    }
  }
  const { prompt: _prompt, ...meta } = poster;
  assertNoSpoilers(meta);
}
