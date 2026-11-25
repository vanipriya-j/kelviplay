import type { PrismaClient } from "@prisma/client";

export function answerVideoKey(questionId: string) {
  return `question-answer-video:${questionId}`;
}

export async function getAnswerVideo(db: Pick<PrismaClient, "appConfig">, questionId: string) {
  const row = await db.appConfig.findUnique({
    where: { key: answerVideoKey(questionId) },
    select: { value: true },
  });
  return typeof row?.value === "string" ? row.value : null;
}
