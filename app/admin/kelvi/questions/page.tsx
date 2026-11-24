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
      <div className="flex items-end justify-between gap-4">
        <h1 className="font-serif text-4xl">Questions</h1>
        <div className="flex gap-4 text-sm tracking-[0.14em] uppercase">
          <Link href="/play/kelvi/practice">Practice</Link>
          <Link href="/admin/kelvi/questions/new">New Kelvi</Link>
        </div>
      </div>
      <ul className="mt-8 divide-y divide-rule">
        {questions.map((question) => (
          <li key={question.id} className="py-4">
            <div className="flex justify-between gap-4">
              <Link href={`/admin/kelvi/questions/${question.id}`} className="min-w-0 flex-1">
                <p className="font-serif text-xl">
                  #{question.number} {question.internalTitle}
                </p>
                <p className="mt-1 line-clamp-1 text-sm text-muted">{question.questionText}</p>
              </Link>
              <div className="text-right text-xs uppercase tracking-wide text-muted">
                <p>{computeQuestionStatus(question)}</p>
                <p className="mt-1">{question.category.name}</p>
                <p className="mt-1">{question._count.attempts} plays</p>
                <p className="mt-2">
                  <Link href={`/play/kelvi/practice/${question.id}`} className="text-ink">
                    Try untimed
                  </Link>
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
