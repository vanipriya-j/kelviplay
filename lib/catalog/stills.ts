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
