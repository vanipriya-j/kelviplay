const TAMIL = /[\u0B80-\u0BFF]/g;

export function normalizeAnswer(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0b80-\u0bff\s]/gi, "")
    .replace(TAMIL, (ch) => ch)
    .replace(/\s+/g, " ")
    .trim();
}

export function asStringArray(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string");
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return asStringArray(parsed);
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

export function gradeAnswer(input: {
  questionType: string;
  submitted: string;
  correctAnswer: string;
  acceptableAnswers: unknown;
  options: { id: string; text: string; isCorrect: boolean }[];
}): boolean {
  const submitted = input.submitted.trim();
  if (!submitted) return false;

  if (input.questionType === "MULTIPLE_CHOICE") {
    const byId = input.options.find((option) => option.id === submitted);
    if (byId) return byId.isCorrect;
    const normalized = normalizeAnswer(submitted);
    return input.options.some(
      (option) => option.isCorrect && normalizeAnswer(option.text) === normalized,
    );
  }

  const candidates = [
    input.correctAnswer,
    ...asStringArray(input.acceptableAnswers),
  ].map(normalizeAnswer);
  const normalized = normalizeAnswer(submitted);
  return candidates.includes(normalized);
}
