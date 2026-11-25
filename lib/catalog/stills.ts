/** Drive stills are movie-poster art, not typeset question cards. */

export function padKelviNumber(number: number) {
  return String(number).padStart(4, "0");
}

export function questionStillFile(number: number) {
  return `kelvi-${padKelviNumber(number)}-question.png`;
}

export function answerStillFile(number: number) {
  return `kelvi-${padKelviNumber(number)}-answer.png`;
}

/** Older catalog name, used if GPT has not split question/answer stills yet. */
export function legacyStillFile(number: number) {
  return `kelvi-${padKelviNumber(number)}.png`;
}

export function stillPath(number: number, side: "question" | "answer") {
  return `/api/kelvi/still?number=${number}&side=${side}`;
}

export function stillCandidates(number: number, side: "question" | "answer") {
  if (side === "answer") return [answerStillFile(number)];
  return [questionStillFile(number), legacyStillFile(number)];
}

export const STILL_ART = {
  aspect: "2:3 portrait, 1080×1920",
  look: "Tamil / Carnatic / Chennai film poster. Light, grain, dusk, silk, brass, temple stone, filter coffee steam. Not a quiz card.",
  forbidden: [
    "Do not print the question sentence",
    "Do not print the answer word",
    "Do not print options, scores, or KELVI CATALOG type sheets",
    "Do not put answers on public share cards",
  ],
} as const;

export function matchStillName(fileName: string, number: number, side: "question" | "answer") {
  const name = fileName.trim().toLowerCase();
  if (!/\.(png|jpe?g|webp|gif)$/.test(name)) return false;
  const pad = padKelviNumber(number);
  const raw = String(number);
  const hasNumber =
    name.includes(pad) ||
    name.includes(`kelvi-${raw}`) ||
    name.includes(`kelvi_${raw}`) ||
    name.includes(`${raw}-question`) ||
    name.includes(`${raw}-answer`);
  if (!hasNumber) return false;
  const isAnswer = /answer|reveal/.test(name);
  return side === "answer" ? isAnswer : !isAnswer;
}
