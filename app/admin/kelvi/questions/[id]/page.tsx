import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { asStringArray } from "@/lib/game/answers";

export default async function EditQuestionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [question, categories] = await Promise.all([
    prisma.question.findUnique({
      where: { id },
      include: { options: { orderBy: { sortOrder: "asc" } } },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!question) notFound();

  return (
    <div>
      <h1 className="font-serif text-4xl">Kelvi #{question.number}</h1>
      <QuestionForm
        categories={categories}
        defaultNumber={question.number}
        question={{
          id: question.id,
          number: question.number,
          internalTitle: question.internalTitle,
          questionText: question.questionText,
          questionType: question.questionType,
          categoryId: question.categoryId,
          difficulty: question.difficulty,
          correctAnswer: question.correctAnswer,
          acceptableAnswers: asStringArray(question.acceptableAnswers).join("\n"),
          options: question.options
            .map((option) => `${option.isCorrect ? "* " : ""}${option.text}`)
            .join("\n"),
          releaseAt: toInput(question.releaseAt),
          expireAt: toInput(question.expireAt),
          status: question.status === "ARCHIVED" ? "ARCHIVED" : question.status === "DRAFT" ? "DRAFT" : "SCHEDULED",
          competitive: question.competitive,
          streakRule: question.streakRule,
          scoringConfig: JSON.stringify(question.scoringConfig ?? {}, null, 2),
        }}
      />
    </div>
  );
}

function toInput(date: Date) {
  return date.toISOString().slice(0, 16);
}
