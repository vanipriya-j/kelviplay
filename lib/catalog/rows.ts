import type { PrismaClient } from "@prisma/client";
import { asStringArray } from "../game/answers";
import { computeQuestionStatus, toIstDatetimeLocal } from "../game/time";
import { KELVI_SLUG } from "../game/scoring";

export type CatalogRow = {
  number: number;
  title: string;
  question: string;
  type: string;
  category: string;
  difficulty: string;
  answer: string;
  acceptable: string;
  options: string;
  imageFile: string;
  mediaUrl: string;
  status: string;
  releaseAtIst: string;
  expireAtIst: string;
};

export function imageFileName(number: number) {
  return `kelvi-${String(number).padStart(4, "0")}.png`;
}

export async function listCatalogRows(db: PrismaClient): Promise<CatalogRow[]> {
  const questions = await db.question.findMany({
    where: { game: { slug: KELVI_SLUG } },
    include: {
      category: { select: { name: true } },
      options: { orderBy: { sortOrder: "asc" } },
    },
    orderBy: { number: "asc" },
  });

  return questions.map((question) => ({
    number: question.number,
    title: question.internalTitle,
    question: question.questionText,
    type: question.questionType,
    category: question.category.name,
    difficulty: question.difficulty,
    answer: question.correctAnswer,
    acceptable: asStringArray(question.acceptableAnswers).join(" | "),
    options: question.options
      .map((option) => `${option.isCorrect ? "* " : ""}${option.text}`)
      .join(" | "),
    imageFile: imageFileName(question.number),
    mediaUrl: question.mediaUrl ?? "",
    status: computeQuestionStatus(question),
    releaseAtIst: toIstDatetimeLocal(question.releaseAt),
    expireAtIst: toIstDatetimeLocal(question.expireAt),
  }));
}

export function catalogCsv(rows: CatalogRow[]) {
  const headers = [
    "number",
    "title",
    "question",
    "type",
    "category",
    "difficulty",
    "answer",
    "acceptable",
    "options",
    "imageFile",
    "mediaUrl",
    "status",
    "releaseAtIst",
    "expireAtIst",
  ] as const;
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((key) => csvCell(row[key])).join(","));
  }
  return `${lines.join("\n")}\n`;
}

function csvCell(value: string | number) {
  const text = String(value ?? "");
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
