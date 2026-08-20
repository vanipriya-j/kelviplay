import { prisma } from "@/lib/db";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function NewQuestionPage() {
  const [categories, last] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findFirst({ orderBy: { number: "desc" }, select: { number: true } }),
  ]);
  return (
    <div>
      <h1 className="font-serif text-4xl">New Kelvi</h1>
      <QuestionForm categories={categories} defaultNumber={(last?.number ?? 193) + 1} />
    </div>
  );
}
