"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";
import { submitPracticeAction } from "@/lib/actions/practice";
import { cn } from "@/lib/utils";
import { QuestionStill } from "./QuestionStill";
import { PlayLink, PlaySpinner } from "@/components/layout/PlayFrame";

type QuestionPayload = {
  id: string;
  number: number;
  title?: string | null;
  questionText: string;
  questionType: string;
  category: string;
  mediaUrl?: string | null;
  mediaKind?: string | null;
  questionStill: string;
  answerStill: string;
  options: { id: string; text: string; sortOrder: number }[];
};

type Grade = {
  correct: boolean;
  answer: string;
  nextId: string | null;
  correctOptionId: string | null;
  answerVideoUrl: string | null;
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
  const [pending, setPending] = useState(false);
  const lockRef = useRef(false);
  const hasAudio = Boolean(question.mediaUrl && question.mediaKind !== "video" && (question.questionType === "AUDIO" || question.mediaKind === "audio"));
  const multiple = question.questionType === "MULTIPLE_CHOICE";

  function submit(answer: string) {
    if (lockRef.current || grade) return;
    lockRef.current = true;
    flushSync(() => {
      setChosen(answer);
      setPending(true);
      setError(null);
    });
    void (async () => {
      try {
        const result = await submitPracticeAction({
          questionId: question.id,
          answer,
        });
        if (!result.ok) {
          lockRef.current = false;
          setError(result.message ?? "Could not lock that in.");
          setChosen(null);
          setPending(false);
          return;
        }
        setGrade({
          correct: result.correct,
          answer: result.answer,
          nextId: result.nextId,
          correctOptionId: result.correctOptionId,
          answerVideoUrl: result.answerVideoUrl,
        });
        setPending(false);
      } catch {
        lockRef.current = false;
        setError("Could not lock that in. Try again.");
        setChosen(null);
        setPending(false);
      }
    })();
  }

  function reset() {
    lockRef.current = false;
    setText("");
    setChosen(null);
    setError(null);
    setGrade(null);
    setPending(false);
  }

  const videoSrc = grade ? grade.answerVideoUrl : question.mediaKind === "video" ? question.mediaUrl : null;
  const stillSrc = grade ? question.answerStill : question.questionStill;
  const locked = pending || Boolean(grade);
  const chosenLabel = multiple
    ? question.options.find((option) => option.id === chosen)?.text
    : chosen;

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi #{question.number}</p>
          <p className="mt-2 text-[11px] tracking-[0.16em] uppercase text-terracotta">
            {grade ? (grade.correct ? "You knew it" : "Not this one") : pending ? "Locked in" : "Practice · no clock"}
          </p>
        </div>
        <p className="text-[11px] tracking-[0.16em] uppercase text-muted">Not scored</p>
      </header>

      <div className="kelvi-round">
      <QuestionStill
        number={question.number}
        category={question.category}
        title={question.title}
        questionText={question.questionText}
        src={question.mediaUrl && !hasAudio && !videoSrc && !grade ? question.mediaUrl : stillSrc}
        videoSrc={videoSrc}
        videoLabel={grade ? "Badhil video" : "Kelvi video"}
      />

      <section className="kelvi-round-body" aria-label="Answer">
      {!grade ? (
        <p className="mt-3 text-sm text-muted">
          {multiple ? "Tap the one you know. You’ll see if it’s right." : "Type the word, then lock it in."}
        </p>
      ) : (
        <p
          role="status"
          className={cn(
            "mt-4 font-serif text-3xl",
            grade.correct ? "text-forest" : "text-terracotta",
          )}
        >
          {grade.correct ? "Correct" : "Answer revealed"}<span className="block text-ink">{grade.answer}</span>
        </p>
      )}

      {hasAudio ? (
        <audio src={question.mediaUrl ?? undefined} controls className="mt-6 w-full" />
      ) : null}

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {multiple ? (
          question.options.map((option, index) => {
            const state = optionState(option.id, chosen, grade, pending);
            return (
              <button
                key={option.id}
                type="button"
                disabled={locked}
                onClick={() => submit(option.id)}
                className={cn(
                  "option-btn min-h-14 rounded-xl border px-4 py-3 text-left",
                  state.className,
                )}
              >
                <span className="mr-3 font-serif text-sm opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="text-[15px] leading-snug">{option.text}</span>
                {state.label ? (
                  <span className="mt-1 flex items-center gap-2 text-xs">
                    {pending && chosen === option.id ? <PlaySpinner /> : null}
                    {state.label}
                  </span>
                ) : null}
              </button>
            );
          })
        ) : (
          <form
            className="mt-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim()) submit(text.trim());
            }}
          >
            <input
              value={grade ? grade.answer : text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Type your answer"
              autoComplete="off"
              autoFocus
              disabled={locked}
              className="w-full border-b border-ink bg-transparent py-3 font-serif text-2xl outline-none placeholder:text-rule disabled:opacity-80"
            />
            {!grade ? (
              <button
                type="submit"
                disabled={pending || !text.trim()}
                className="mt-8 w-full rounded-full bg-ink py-4 text-sm tracking-[0.28em] text-ivory uppercase disabled:opacity-50"
              >
                {pending ? "LOCKED IN" : "LOCK IN"}
              </button>
            ) : null}
          </form>
        )}
      </div>

      {chosen && !grade ? (
        <div role="status" className="mt-5 rounded-2xl bg-ink px-5 py-5 text-ivory animate-rise">
          <p className="text-[11px] tracking-[0.28em] uppercase text-terracotta">Locked in</p>
          <p className="font-serif mt-2 text-2xl leading-snug">{chosenLabel}</p>
          <p className="mt-2 text-sm text-ivory/70">Checking…</p>
        </div>
      ) : null}

      {grade ? (
        <div className="mt-6">
          <p className="mt-2 text-sm text-muted">Practice does not count toward streak, rank, or the week.</p>
          <div className="kelvi-next mt-6 space-y-3">
            {(grade.nextId ?? nextId) ? (
              <PlayLink
                href={`/play/kelvi/practice/${grade.nextId ?? nextId}`}
                className="block w-full rounded-full bg-ink py-4 text-center text-sm tracking-[0.28em] text-ivory uppercase"
              >
                Next Kelvi
              </PlayLink>
            ) : (
              <p className="text-center text-sm text-muted">That was the last one in practice.</p>
            )}
            <button
              type="button"
              onClick={reset}
              className="block w-full rounded-full border border-rule py-4 text-sm tracking-[0.28em] uppercase"
            >
              Try this again
            </button>
          </div>
        </div>
      ) : null}
      {error ? <p role="alert" className="mt-4 rounded-xl border border-terracotta px-4 py-3 text-sm text-terracotta">{error}</p> : null}
      </section>
      </div>
    </div>
  );
}

function optionState(
  optionId: string,
  chosen: string | null,
  grade: Grade | null,
  pending: boolean,
) {
  if (grade) {
    const isCorrect = optionId === grade.correctOptionId;
    const isChosen = optionId === chosen;
    if (isCorrect) {
      return { className: "border-forest bg-forest text-ivory", label: "Correct" };
    }
    if (isChosen) {
      return { className: "border-terracotta bg-terracotta text-ivory", label: "Your tap" };
    }
    return { className: "border-rule bg-cloud text-muted", label: null };
  }
  if (chosen === optionId) {
    return {
      className: "option-btn-locked border-ink bg-ink text-ivory",
      label: pending ? "Checking…" : "Your tap",
    };
  }
  return {
    className: chosen ? "border-rule bg-cloud text-muted" : "border-rule bg-cloud text-ink",
    label: null,
  };
}
