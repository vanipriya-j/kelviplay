import { prisma } from "@/lib/db";
import { QuestionForm } from "@/components/admin/QuestionForm";
import { nextDropOnOrAfter } from "@/lib/game/rhythm";
import { toIstDatetimeLocal } from "@/lib/game/time";

export default async function NewQuestionPage() {
  const [categories, last] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.question.findFirst({
      orderBy: { number: "desc" },
      select: { number: true, expireAt: true },
    }),
  ]);
  const slot = nextDropOnOrAfter(last?.expireAt ?? new Date());

  return (
    <div>
      <h1 className="font-serif text-4xl">New Kelvi</h1>
      <p className="mt-2 text-sm text-muted">
        Drops snap to the 2-hour IST grid (6:00 AM–8:00 PM). Last window ends at 10 PM, when winners go up.
      </p>
      <QuestionForm
        categories={categories}
        defaultNumber={(last?.number ?? 193) + 1}
        defaultReleaseAt={toIstDatetimeLocal(slot.releaseAt)}
        defaultExpireAt={toIstDatetimeLocal(slot.expireAt)}
      />
    </div>
  );
}
