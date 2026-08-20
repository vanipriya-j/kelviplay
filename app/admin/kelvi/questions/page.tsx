import Link from "next/link";
import { prisma } from "@/lib/db";
import { computeQuestionStatus } from "@/lib/game/time";
import { KELVI_SLUG } from "@/lib/game/scoring";

export const dynamic = "force-dynamic";

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    where: { game: { slug: KELVI_SLUG } },
    include: { category: true, _count: { select: { attempts: true } } },
    orderBy: { number: "desc" },
  });

  return (
    <div>
      <div className="flex items-end justify-between">
        <h1 className="font-serif text-4xl">Questions</h1>
        <Link href="/admin/kelvi/questions/new" className="text-sm tracking-[0.14em] uppercase">
          New Kelvi
        </Link>
      </div>
      <ul className="mt-8 divide-y divide-rule">
        {questions.map((question) => (
          <li key={question.id} className="py-4">
            <Link href={`/admin/kelvi/questions/${question.id}`} className="flex justify-between gap-4">
              <div>
                <p className="font-serif text-xl">
                  #{question.number} {question.internalTitle}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-muted">{question.questionText}</p>
              </div>
              <div className="text-right text-xs uppercase tracking-wide text-muted">
                <p>{computeQuestionStatus(question)}</p>
                <p className="mt-1">{question.category.name}</p>
                <p className="mt-1">{question._count.attempts} plays</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
