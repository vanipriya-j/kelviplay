import type { Prisma, PrismaClient } from "@prisma/client";
import { stillPath } from "../catalog/stills";
import { asStringArray, gradeAnswer } from "./answers";
import { KELVI_SLUG } from "./scoring";
import { computeQuestionStatus } from "./time";

export type PracticeVisibility = {
  includeUpcoming: boolean;
};

export type PracticeListItem = {
  id: string;
  number: number;
  title: string;
  category: string;
  type: string;
  status: string;
};

export type PracticeQuestion = {
  id: string;
  number: number;
  questionText: string;
  questionType: string;
  category: string;
  mediaUrl: string | null;
  mediaKind: string | null;
  questionStill: string;
  answerStill: string;
  options: { id: string; text: string; sortOrder: number }[];
};

export type PracticeGrade = {
  correct: boolean;
  answer: string;
  acceptable: string[];
  correctOptionId: string | null;
};

const PRACTICE_SELECT = {
  id: true,
  number: true,
  internalTitle: true,
  questionText: true,
  questionType: true,
  mediaUrl: true,
  mediaKind: true,
  status: true,
  releaseAt: true,
  expireAt: true,
  correctAnswer: true,
  acceptableAnswers: true,
  category: { select: { name: true } },
  options: {
    select: { id: true, text: true, isCorrect: true, sortOrder: true },
    orderBy: { sortOrder: "asc" as const },
  },
} as const;

export function isPracticeVisible(
  question: { status: string; releaseAt: Date; expireAt: Date },
  visibility: PracticeVisibility,
  now = new Date(),
) {
  if (question.status === "ARCHIVED") return false;
  if (visibility.includeUpcoming) return true;
  if (question.status === "DRAFT") return false;
  const state = computeQuestionStatus(question, now);
  return state === "LIVE" || state === "EXPIRED";
}

export function nextPracticeQuestionId(
  questions: Array<{ id: string }>,
  currentId: string,
) {
  const index = questions.findIndex((question) => question.id === currentId);
  if (index < 0 || index >= questions.length - 1) return null;
  return questions[index + 1].id;
}

export function gradePractice(input: {
  questionType: string;
  submitted: string;
  correctAnswer: string;
  acceptableAnswers: unknown;
  options: { id: string; text: string; isCorrect: boolean }[];
}): PracticeGrade {
  const correct = gradeAnswer(input);
  return {
    correct,
    answer: input.correctAnswer,
    acceptable: asStringArray(input.acceptableAnswers),
    correctOptionId: input.options.find((option) => option.isCorrect)?.id ?? null,
  };
}

export async function listPracticeQuestions(
  db: PrismaClient,
  visibility: PracticeVisibility,
  now = new Date(),
): Promise<PracticeListItem[]> {
  const questions = await db.question.findMany({
    where: {
      game: { slug: KELVI_SLUG },
      status: { not: "ARCHIVED" },
    },
    select: {
      id: true,
      number: true,
      internalTitle: true,
      questionType: true,
      status: true,
      releaseAt: true,
      expireAt: true,
      category: { select: { name: true } },
    },
    orderBy: { number: "asc" },
  });

  return questions
    .filter((question) => isPracticeVisible(question, visibility, now))
    .map((question) => ({
      id: question.id,
      number: question.number,
      title: question.internalTitle,
      category: question.category.name,
      type: question.questionType,
      status: computeQuestionStatus(question, now),
    }))
    .sort((a, b) => a.number - b.number);
}

function toPracticeQuestion(row: {
  id: string;
  number: number;
  questionText: string;
  questionType: string;
  mediaUrl: string | null;
  mediaKind: string | null;
  category: { name: string };
  options: { id: string; text: string; sortOrder: number }[];
}): PracticeQuestion {
  return {
    id: row.id,
    number: row.number,
    questionText: row.questionText,
    questionType: row.questionType,
    category: row.category.name,
    mediaUrl: row.mediaUrl,
    mediaKind: row.mediaKind,
    questionStill: stillPath(row.number, "question"),
    answerStill: stillPath(row.number, "answer"),
    options: row.options.map((option) => ({
      id: option.id,
      text: option.text,
      sortOrder: option.sortOrder,
    })),
  };
}

export function nextPracticeWhere(
  afterNumber: number,
  visibility: PracticeVisibility,
  now = new Date(),
): Prisma.QuestionWhereInput {
  if (visibility.includeUpcoming) {
    return {
      game: { slug: KELVI_SLUG },
      number: { gt: afterNumber },
      status: { not: "ARCHIVED" },
    };
  }
  return {
    game: { slug: KELVI_SLUG },
    number: { gt: afterNumber },
    status: { notIn: ["DRAFT", "ARCHIVED"] },
    releaseAt: { lte: now },
  };
}

export async function nextPracticeQuestion(
  db: PrismaClient,
  afterNumber: number,
  visibility: PracticeVisibility,
  now = new Date(),
) {
  return db.question.findFirst({
    where: nextPracticeWhere(afterNumber, visibility, now),
    orderBy: { number: "asc" },
    select: { id: true, number: true },
  });
}

export async function getPracticeQuestion(
  db: PrismaClient,
  questionId: string,
  visibility: PracticeVisibility,
  now = new Date(),
): Promise<{ question: PracticeQuestion; nextId: string | null } | null> {
  const row = await db.question.findUnique({
    where: { id: questionId },
    select: PRACTICE_SELECT,
  });
  if (!row || !isPracticeVisible(row, visibility, now)) return null;
  const next = await nextPracticeQuestion(db, row.number, visibility, now);
  return {
    question: toPracticeQuestion(row),
    nextId: next?.id ?? null,
  };
}

export async function gradePracticeQuestion(
  db: PrismaClient,
  input: { questionId: string; answer: string; visibility: PracticeVisibility },
  now = new Date(),
) {
  const row = await db.question.findUnique({
    where: { id: input.questionId },
    select: PRACTICE_SELECT,
  });
  if (!row || !isPracticeVisible(row, input.visibility, now)) return null;
  const next = await nextPracticeQuestion(db, row.number, input.visibility, now);

  return {
    ...gradePractice({
      questionType: row.questionType,
      submitted: input.answer,
      correctAnswer: row.correctAnswer,
      acceptableAnswers: row.acceptableAnswers,
      options: row.options,
    }),
    number: row.number,
    nextId: next?.id ?? null,
  };
}
