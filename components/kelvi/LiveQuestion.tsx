"use client";

import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { stillPath } from "@/lib/catalog/stills";
import { submitKelviAction } from "@/lib/actions/kelvi";
import { cn } from "@/lib/utils";
import { ElapsedTimer } from "./ElapsedTimer";
import { QuestionStill } from "./QuestionStill";

type QuestionPayload = {
  id: string;
  number: number;
  title?: string | null;
  questionText: string;
  questionType: string;
  category?: string;
  mediaUrl?: string | null;
  mediaKind?: string | null;
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
  const [pending, setPending] = useState(false);
  const lockRef = useRef(false);
  const opened = useMemo(() => new Date().toISOString(), []);
  const multiple = question.questionType === "MULTIPLE_CHOICE";
  const chosenLabel = multiple
    ? question.options.find((option) => option.id === chosen)?.text
    : chosen;

  function submit(answer: string) {
    if (lockRef.current) return;
    lockRef.current = true;
    flushSync(() => {
      setChosen(answer);
      setPending(true);
      setError(null);
    });
    void (async () => {
      try {
        const result = await submitKelviAction({
          questionId: question.id,
          answer,
          clientOpenedAt: opened,
          clientSubmittedAt: new Date().toISOString(),
        });
        if (!result.ok) {
          lockRef.current = false;
          setError(result.message ?? "Could not lock that in.");
          setChosen(null);
          setPending(false);
          return;
        }
        router.replace(`/play/kelvi/result/${result.attemptId}`);
      } catch {
        lockRef.current = false;
        setError("Could not lock that in. Try again.");
        setChosen(null);
        setPending(false);
      }
    })();
  }

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[0.32em] uppercase text-muted">Kelvi #{question.number}</p>
          <p className="mt-2 text-[11px] tracking-[0.16em] uppercase text-terracotta">
            {pending ? "Locked in" : "Tap what you know"}
          </p>
        </div>
        <ElapsedTimer startedAt={startedAt} />
      </header>

      <QuestionStill
        number={question.number}
        category={question.category ?? "Kelvi"}
        title={question.title}
        questionText={question.questionText}
        src={question.mediaUrl || stillPath(question.number, "question")}
      />

      <h1 className="font-serif mt-6 text-[1.7rem] leading-snug text-ink">{question.questionText}</h1>
      <p className="mt-3 text-sm text-muted">
        {multiple ? "Tap one answer. Speed is counted from now." : "Type the word, then lock it in."}
      </p>
      {question.mediaUrl && (question.questionType === "AUDIO" || question.mediaKind === "audio") ? (
        <audio src={question.mediaUrl} controls className="mt-6 w-full" />
      ) : null}

      <div className="mt-6 flex flex-1 flex-col gap-3">
        {multiple ? (
          question.options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              disabled={pending || Boolean(chosen)}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                submit(option.id);
              }}
              onClick={() => submit(option.id)}
              className={cn(
                "option-btn min-h-14 rounded-2xl border px-4 py-4 text-left",
                chosen === option.id
                  ? "option-btn-locked border-ink bg-ink text-ivory"
                  : chosen
                    ? "border-rule bg-cloud text-muted"
                    : "border-rule bg-cloud",
              )}
            >
              <span className="mr-3 font-serif text-sm opacity-70">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-[15px] leading-snug">{option.text}</span>
              {chosen === option.id ? (
                <span className="mt-1 block text-[11px] tracking-[0.16em] uppercase">Locked in</span>
              ) : null}
            </button>
          ))
        ) : (
          <form
            className="mt-2"
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
              {pending ? "LOCKED IN" : "LOCK IN"}
            </button>
          </form>
        )}
      </div>
      {chosen && pending ? (
        <div className="mt-5 rounded-2xl bg-ink px-5 py-5 text-ivory animate-rise">
          <p className="text-[11px] tracking-[0.28em] uppercase text-terracotta">Locked in</p>
          <p className="font-serif mt-2 text-2xl leading-snug">{chosenLabel}</p>
          <p className="mt-2 text-sm text-ivory/70">Saving your answer…</p>
        </div>
      ) : null}
      {error ? <p className="mt-4 text-sm text-terracotta">{error}</p> : null}
    </div>
  );
}
