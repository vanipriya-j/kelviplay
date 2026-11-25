"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { gradePracticeQuestion } from "@/lib/game/practice";
import { sessionFromCookie } from "@/lib/session-cookie";

const submitSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1).max(280),
});

export async function practiceVisibility() {
  const session = await sessionFromCookie();
  return { includeUpcoming: Boolean(session?.user?.isAdmin) };
}

export async function submitPracticeAction(input: unknown) {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, code: "INVALID" as const, message: "Could not lock that in." };
  }

  try {
    const result = await gradePracticeQuestion(prisma, {
      questionId: parsed.data.questionId,
      answer: parsed.data.answer,
      visibility: await practiceVisibility(),
    });
    if (!result) {
      return {
        ok: false as const,
        code: "NO_QUESTION" as const,
        message: "That Kelvi is not in practice.",
      };
    }
    return { ok: true as const, ...result };
  } catch (error) {
    console.error("[kelvi] practice submit failed", error);
    return {
      ok: false as const,
      code: "UNAVAILABLE" as const,
      message: "Could not lock that in. Try again.",
    };
  }
}
