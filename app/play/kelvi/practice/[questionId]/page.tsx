import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPracticeQuestion } from "@/lib/game/practice";
import { PracticeRound } from "@/components/kelvi/PracticeRound";
import { sessionFromCookie } from "@/lib/session-cookie";

export const dynamic = "force-dynamic";

export default async function PracticeQuestionPage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  const session = await sessionFromCookie();
  let opened = null;
  try {
    opened = await getPracticeQuestion(prisma, questionId, {
      includeUpcoming: Boolean(session?.user?.isAdmin),
    });
  } catch (error) {
    console.error("[kelvi] practice question failed", error);
  }
  if (!opened) notFound();

  return (
    <>
      <PracticeRound key={opened.question.id} question={opened.question} nextId={opened.nextId} />
      <Link
        href="/play/kelvi/practice"
        className="mt-8 text-center text-xs tracking-[0.18em] uppercase text-muted"
      >
        All questions
      </Link>
    </>
  );
}
