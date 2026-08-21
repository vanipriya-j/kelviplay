"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { submitKelviAction } from "@/lib/actions/kelvi";
import { cn } from "@/lib/utils";
import { ElapsedTimer } from "./ElapsedTimer";

type QuestionPayload = {
  id: string;
  number: number;
  questionText: string;
  questionType: string;
  options: { id: string; text: string; sortOrder: number }[];
};

export function LiveQuestion({
  question,
  startedAt,
}: {
  question: QuestionPayload;
  startedAt: string;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const opened = useMemo(() => new Date().toISOString(), []);

  function submit(answer: string) {
    if (pending || chosen) return;
    setChosen(answer);
    startTransition(async () => {
      try {
        const result = await submitKelviAction({
          questionId: question.id,
          answer,
          clientOpenedAt: opened,
          clientSubmittedAt: new Date().toISOString(),
        });
        if (!result.ok) {
          setError(result.message ?? "Could not lock that in.");
          setChosen(null);
          return;
        }
        router.replace(`/play/kelvi/result/${result.attemptId}`);
      } catch {
        setError("Could not lock that in. Try again.");
        setChosen(null);
      }
    });
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi #{question.number}</p>
          <p className="mt-2 text-[11px] tracking-[0.16em] uppercase text-terracotta">How fast do you know it?</p>
        </div>
        <ElapsedTimer startedAt={startedAt} />
      </header>

      <h1 className="font-serif mt-10 text-[1.85rem] leading-snug text-ink">{question.questionText}</h1>

      <div className="mt-10 flex flex-1 flex-col gap-3">
        {question.questionType === "MULTIPLE_CHOICE" ? (
          question.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              disabled={pending || Boolean(chosen)}
              onClick={() => submit(option.id)}
              className={cn(
                "option-btn rounded-2xl border border-rule bg-cloud px-4 py-4 text-left",
                chosen === option.id && "border-ink bg-paper",
              )}
            >
              <span className="mr-3 font-serif text-sm text-muted">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] leading-snug">{option.text}</span>
            </button>
          ))
        ) : (
          <form
            className="mt-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim()) submit(text.trim());
            }}
          >
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
              autoFocus
              disabled={pending}
              className="w-full border-b border-ink bg-transparent py-3 font-serif text-2xl outline-none placeholder:text-rule"
            />
            <button
              type="submit"
              disabled={pending || !text.trim()}
              className="mt-8 w-full rounded-full bg-ink py-4 text-sm tracking-[0.28em] text-ivory uppercase disabled:opacity-50"
            >
              {pending ? "LOCKING…" : "LOCK IN"}
            </button>
          </form>
        )}
      </div>
      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
