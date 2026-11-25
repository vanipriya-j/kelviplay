import { PlayLink } from "@/components/layout/PlayFrame";
import { bundledStillPath } from "@/lib/catalog/stills";
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
        <PlayLink
          href={`/play/kelvi/practice/${first.id}`}
          className="kelvi-cta mt-6 block w-full rounded-xl py-4 text-center text-sm font-bold"
        >
          Start from #{first.number}
        </PlayLink>
      ) : (
        <p className="mt-10 text-sm text-muted">
          No questions are in practice yet. Add Kelvis in admin.
        </p>
      )}

      {questions.length ? (
        <ul className="kelvi-practice-grid mt-8">
          {questions.map((question) => {
            const art = bundledStillPath(question.number, "question");
            return (
              <li key={question.id}>
                <PlayLink href={`/play/kelvi/practice/${question.id}`} prefetch={false} className="kelvi-practice-card">
                  {art ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={art} alt="" loading="lazy" />
                  ) : null}
                  <span><span>{question.category}</span><strong>Kelvi #{question.number}</strong></span>
                </PlayLink>
              </li>
            );
          })}
        </ul>
      ) : null}

      <PlayLink href="/play/kelvi" className="mt-8 text-center text-xs tracking-[0.18em] uppercase text-muted">
        Back to Kelvi
      </PlayLink>
    </div>
  );
}
