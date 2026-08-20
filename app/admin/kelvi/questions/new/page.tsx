import { prisma } from "@/lib/db";
import { QuestionForm } from "@/components/admin/QuestionForm";

export default async function NewQuestionPage() {
  const [categories, last] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findFirst({
      orderBy: { number: "desc" },
      select: { number: true, expireAt: true },
    }),
  ]);
  const nextRelease = last ? new Date(last.expireAt.getTime() + 30 * 60 * 1000) : null;
  const nextExpire = nextRelease ? new Date(nextRelease.getTime() + 2 * 60 * 60 * 1000) : null;

  return (
    <div>
      <h1 className="font-serif text-4xl">New Kelvi</h1>
      <QuestionForm
        categories={categories}
        defaultNumber={(last?.number ?? 193) + 1}
        defaultReleaseAt={nextRelease ? nextRelease.toISOString().slice(0, 16) : ""}
        defaultExpireAt={nextExpire ? nextExpire.toISOString().slice(0, 16) : ""}
      />
    </div>
  );
}
