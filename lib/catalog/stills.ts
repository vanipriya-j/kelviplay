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
