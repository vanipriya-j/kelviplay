import Link from "next/link";
import { prisma } from "@/lib/db";
import { listPracticeQuestions } from "@/lib/game/practice";
import { sessionFromCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export default async function PracticeIndexPage() {
  const session = await sessionFromCookie();
  let questions: Awaited<ReturnType<typeof listPracticeQuestions>> = [];
  try {
    questions = await listPracticeQuestions(prisma, {
      includeUpcoming: Boolean(session?.user?.isAdmin),
    });
  } catch (error) {
    console.error("[kelvi] practice list failed", error);
  }
  const first = questions[0];

  return (
    <div className="flex flex-1 flex-col">
      <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Practice</p>
      <h1 className="font-serif mt-4 text-4xl leading-tight">Practice Kelvi</h1>
      <p className="mt-4 text-sm text-muted">
        Choose an answer or type your own. You’ll get instant feedback, with no timer or points.
      </p>

      {first ? (
        <Link
          href={`/play/kelvi/practice/${first.id}`}
          className="mt-10 block w-full rounded-full bg-ink py-4 text-center text-sm tracking-[0.28em] text-ivory uppercase"
        >
          Start from #{first.number}
        </Link>
      ) : (
        <p className="mt-10 text-sm text-muted">
          No questions are in practice yet. Add Kelvis in admin.
        </p>
      )}

      {questions.length ? (
        <ul className="mt-10 divide-y divide-rule">
          {questions.map((question) => (
            <li key={question.id}>
              <Link href={`/play/kelvi/practice/${question.id}`} className="flex justify-between gap-4 py-4">
                <div>
                  <p className="font-serif text-xl">
                    Kelvi #{question.number}
                  </p>
                  <p className="mt-1 text-xs tracking-[0.14em] uppercase text-muted">
                    {question.category} · {question.type.replaceAll("_", " ")}
                  </p>
                </div>
                <p className="text-xs tracking-[0.14em] uppercase text-muted">{question.status}</p>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <Link href="/play/kelvi" className="mt-8 text-center text-xs tracking-[0.18em] uppercase text-muted">
        Back to Kelvi
      </Link>
    </div>
  );
}
