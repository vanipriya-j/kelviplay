"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { submitPracticeAction } from "@/lib/actions/practice";
import { cn } from "@/lib/utils";

type QuestionPayload = {
  id: string;
  number: number;
  questionText: string;
  questionType: string;
  mediaUrl?: string | null;
  mediaKind?: string | null;
  options: { id: string; text: string; sortOrder: number }[];
};

type Grade = {
  correct: boolean;
  answer: string;
  nextId: string | null;
  correctOptionId: string | null;
};

export function PracticeRound({
  question,
  nextId,
}: {
  question: QuestionPayload;
  nextId: string | null;
}) {
  const [text, setText] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [grade, setGrade] = useState<Grade | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(answer: string) {
    if (pending || grade) return;
    setChosen(answer);
    startTransition(async () => {
      try {
        const result = await submitPracticeAction({
          questionId: question.id,
          answer,
        });
        if (!result.ok) {
          setError(result.message ?? "Could not lock that in.");
          setChosen(null);
          return;
        }
        setGrade({
          correct: result.correct,
          answer: result.answer,
          nextId: result.nextId,
          correctOptionId: result.correctOptionId,
        });
      } catch {
        setError("Could not lock that in. Try again.");
        setChosen(null);
      }
    });
  }

  function reset() {
    setText("");
    setChosen(null);
    setError(null);
    setGrade(null);
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi #{question.number}</p>
          <p className="mt-2 text-[11px] tracking-[0.16em] uppercase text-terracotta">
            Practice · no clock
          </p>
        </div>
        <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Not scored</p>
      </header>

      <h1 className="font-serif mt-10 text-[1.85rem] leading-snug text-ink">{question.questionText}</h1>
      {question.mediaUrl && (question.questionType === "IMAGE" || question.mediaKind === "image") ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.mediaUrl}
          alt=""
          className="mt-8 w-full rounded-2xl border border-rule"
        />
      ) : null}
      {question.mediaUrl && (question.questionType === "AUDIO" || question.mediaKind === "audio") ? (
        <audio src={question.mediaUrl} controls className="mt-8 w-full" />
      ) : null}

      {grade ? (
        <PracticeResult grade={grade} fallbackNextId={nextId} onAgain={reset} />
      ) : (
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
      )}
      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}

function PracticeResult({
  grade,
  fallbackNextId,
  onAgain,
}: {
  grade: Grade;
  fallbackNextId: string | null;
  onAgain: () => void;
}) {
  const nextId = grade.nextId ?? fallbackNextId;

  return (
    <div className="mt-10">
      {grade.correct ? (
        <>
          <p className="text-[11px] tracking-[0.32em] uppercase text-terracotta">Correct</p>
          <h2 className="font-serif mt-3 text-4xl tracking-wide">You know it.</h2>
        </>
      ) : (
        <>
          <p className="text-[11px] tracking-[0.32em] uppercase text-muted">Not this one</p>
          <h2 className="font-serif mt-3 text-4xl leading-tight">The answer is still yours.</h2>
        </>
      )}
      <p className="mt-6 text-lg">
        Answer · <span className="font-serif">{grade.answer}</span>
      </p>
      <p className="mt-3 text-sm text-muted">Practice does not count toward streak, rank, or the week.</p>

      <div className="mt-10 space-y-3">
        {nextId ? (
          <Link
            href={`/play/kelvi/practice/${nextId}`}
            className="block w-full rounded-full bg-ink py-4 text-center text-sm tracking-[0.28em] text-ivory uppercase"
          >
            Next Kelvi
          </Link>
        ) : (
          <p className="text-center text-sm text-muted">That was the last one in practice.</p>
        )}
        <button
          type="button"
          onClick={onAgain}
          className="block w-full rounded-full border border-rule py-4 text-sm tracking-[0.28em] uppercase"
        >
          Try this again
        </button>
      </div>
    </div>
  );
}
