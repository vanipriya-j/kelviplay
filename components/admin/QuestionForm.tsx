"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteQuestionAction, saveCategoryAction, saveQuestionAction } from "@/lib/actions/admin";

type Category = { id: string; name: string };

type QuestionValues = {
  id?: string;
  number: number;
  internalTitle: string;
  questionText: string;
  questionType: string;
  categoryId: string;
  difficulty: string;
  correctAnswer: string;
  acceptableAnswers: string;
  options: string;
  releaseAt: string;
  expireAt: string;
  status: string;
  competitive: boolean;
  streakRule: string;
  scoringConfig: string;
};

export function QuestionForm({
  categories,
  defaultNumber,
  question,
  defaultReleaseAt = "",
  defaultExpireAt = "",
}: {
  categories: Category[];
  defaultNumber: number;
  question?: QuestionValues;
  defaultReleaseAt?: string;
  defaultExpireAt?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const defaultRelease = question?.releaseAt ?? defaultReleaseAt;
  const defaultExpire = question?.expireAt ?? defaultExpireAt;

  return (
    <form
      className="mt-8 grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        start(async () => {
          const result = await saveQuestionAction({
            id: question?.id,
            number: form.get("number"),
            internalTitle: form.get("internalTitle"),
            questionText: form.get("questionText"),
            questionType: form.get("questionType"),
            categoryId: form.get("categoryId"),
            difficulty: form.get("difficulty"),
            correctAnswer: form.get("correctAnswer"),
            acceptableAnswers: form.get("acceptableAnswers"),
            options: form.get("options"),
            releaseAt: form.get("releaseAt"),
            expireAt: form.get("expireAt"),
            status: form.get("status"),
            competitive: form.get("competitive") === "on",
            streakRule: form.get("streakRule"),
            scoringConfig: form.get("scoringConfig"),
          });
          if (!result.ok) {
            setError(result.error ?? "Could not save.");
            return;
          }
          router.push("/admin/kelvi/questions");
          router.refresh();
        });
      }}
    >
      <Field name="number" label="Number" defaultValue={String(question?.number ?? defaultNumber)} />
      <Field name="internalTitle" label="Internal title" defaultValue={question?.internalTitle} />
      <label className="text-xs tracking-[0.14em] uppercase text-muted">
        Question
        <textarea
          name="questionText"
          required
          defaultValue={question?.questionText}
          className="mt-2 min-h-24 w-full border border-rule bg-cloud p-3 text-base text-ink"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Select
          name="questionType"
          label="Type"
          defaultValue={question?.questionType ?? "MULTIPLE_CHOICE"}
          options={["MULTIPLE_CHOICE", "TEXT", "IMAGE", "AUDIO"]}
        />
        <Select
          name="categoryId"
          label="Category"
          defaultValue={question?.categoryId ?? categories[0]?.id}
          options={categories.map((item) => ({ value: item.id, label: item.name }))}
        />
        <Select
          name="difficulty"
          label="Difficulty"
          defaultValue={question?.difficulty ?? "MEDIUM"}
          options={["EASY", "MEDIUM", "HARD"]}
        />
        <Select
          name="status"
          label="Status"
          defaultValue={question?.status ?? "SCHEDULED"}
          options={["DRAFT", "SCHEDULED", "ARCHIVED"]}
        />
      </div>
      <Field name="correctAnswer" label="Correct answer" defaultValue={question?.correctAnswer} />
      <label className="text-xs tracking-[0.14em] uppercase text-muted">
        Acceptable text variants (one per line)
        <textarea
          name="acceptableAnswers"
          defaultValue={question?.acceptableAnswers}
          className="mt-2 min-h-20 w-full border border-rule bg-cloud p-3 text-base text-ink"
        />
      </label>
      <label className="text-xs tracking-[0.14em] uppercase text-muted">
        Options (prefix correct with *)
        <textarea
          name="options"
          defaultValue={question?.options}
          className="mt-2 min-h-28 w-full border border-rule bg-cloud p-3 text-base text-ink"
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="releaseAt" label="Release" type="datetime-local" defaultValue={defaultRelease} />
        <Field name="expireAt" label="Expiry" type="datetime-local" defaultValue={defaultExpire} />
      </div>
      <Select
        name="streakRule"
        label="Streak rule"
        defaultValue={question?.streakRule ?? "consecutive_correct"}
        options={[
          { value: "consecutive_correct", label: "Consecutive correct" },
          { value: "participation", label: "Participation" },
        ]}
      />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="competitive" defaultChecked={question?.competitive ?? true} />
        Competitive (affects Faster Fingers)
      </label>
      <label className="text-xs tracking-[0.14em] uppercase text-muted">
        Scoring JSON
        <textarea
          name="scoringConfig"
          defaultValue={question?.scoringConfig ?? ""}
          className="mt-2 min-h-28 w-full border border-rule bg-cloud p-3 font-mono text-sm"
        />
      </label>
      {error ? <p className="text-sm text-terracotta">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-ink px-5 py-3 text-xs tracking-[0.16em] text-ivory uppercase"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {question?.id ? (
          <button
            type="button"
            onClick={() => {
              start(async () => {
                await deleteQuestionAction(question.id!);
                router.push("/admin/kelvi/questions");
              });
            }}
            className="text-xs tracking-[0.16em] uppercase text-muted"
          >
            Archive / delete
          </button>
        ) : null}
      </div>
      <AddCategory />
    </form>
  );
}

function Field({
  name,
  label,
  defaultValue,
  type = "text",
}: {
  name: string;
  label: string;
  defaultValue?: string;
  type?: string;
}) {
  return (
    <label className="text-xs tracking-[0.14em] uppercase text-muted">
      {label}
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={name !== "scoringConfig"}
        className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base text-ink outline-none"
      />
    </label>
  );
}

function Select({
  name,
  label,
  defaultValue,
  options,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <label className="text-xs tracking-[0.14em] uppercase text-muted">
      {label}
      <select
        name={name}
        defaultValue={defaultValue}
        className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base outline-none"
      >
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? option : option.label;
          return (
            <option key={value} value={value}>
              {labelText}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function AddCategory() {
  const [pending, start] = useTransition();
  return (
    <div className="border-t border-rule pt-6">
      <p className="text-[10px] tracking-[0.18em] uppercase text-muted">Add category</p>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          start(async () => {
            await saveCategoryAction(String(form.get("name") ?? ""));
          });
        }}
      >
        <input name="name" placeholder="Category name" className="flex-1 border-b border-rule bg-transparent py-2 outline-none" />
        <button type="submit" disabled={pending} className="text-xs uppercase tracking-wide">
          Add
        </button>
      </form>
    </div>
  );
}
