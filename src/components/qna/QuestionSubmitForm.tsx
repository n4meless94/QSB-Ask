"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";

import {
  submitQuestionAction,
  type SubmitQuestionActionResult,
} from "@/app/join/[joinCode]/qna/submit-actions";
import { Button } from "@/components/ui/Button";

type QuestionSubmitFormProps = {
  characterLimit: number;
  eventId: string;
  initialError?: string;
  joinCode: string;
};

const initialState: SubmitQuestionActionResult = { ok: true, message: "" };

export function QuestionSubmitForm({
  characterLimit,
  eventId,
  initialError,
  joinCode,
}: QuestionSubmitFormProps) {
  const submitAction = submitQuestionAction.bind(null, eventId, joinCode);
  const [question, setQuestion] = useState("");

  async function submitAndClearOnSuccess(
    previousState: SubmitQuestionActionResult,
    formData: FormData,
  ) {
    const result = await submitAction(previousState, formData);

    if (result.ok) {
      setQuestion("");
    }

    return result;
  }

  const [state, formAction, isPending] = useActionState(submitAndClearOnSuccess, initialState);
  const activeMessage = state.message || initialError || "";
  const canSubmit = question.trim().length > 0;

  return (
    <form action={formAction} className="grid gap-5 rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex min-w-0 items-start gap-4">
        <span
          aria-hidden="true"
          className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 text-[#00796B]"
        >
          <Pencil className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-[22px] font-semibold leading-[1.2] text-slate-950">Ask a question</h2>
          <p className="mt-1 text-base leading-6 text-slate-600">What would you like to ask?</p>
        </div>
      </div>

      {activeMessage ? (
        <div
          className={`rounded-[14px] border p-3 ${
            state.ok ? "border-teal-100 bg-teal-50 text-[#00796B]" : "border-red-100 bg-red-50 text-red-700"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          <p className="text-sm font-semibold leading-[1.4]">{activeMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="sr-only" htmlFor="question">
          Question
        </label>
        <textarea
          aria-describedby="question-count"
          className="min-h-36 resize-y rounded-[14px] border border-slate-300 bg-white px-4 py-4 text-base leading-6 text-slate-950 shadow-inner outline-none transition-colors placeholder:text-slate-400 focus:border-[#008578] focus:ring-2 focus:ring-[#008578]/20"
          id="question"
          maxLength={characterLimit}
          name="question"
          onChange={(event) => setQuestion(event.currentTarget.value)}
          placeholder="Type your question here..."
          value={question}
        />
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-base leading-6 text-slate-600" id="question-count">
          {question.length} / {characterLimit}
        </p>
        <Button
          className="rounded-[12px] bg-[#008578] px-6 shadow-sm hover:bg-[#00796B] focus-visible:ring-[#008578] sm:min-w-44"
          disabled={!canSubmit}
          loading={isPending}
          type="submit"
        >
          Ask question
      </Button>
      </div>
    </form>
  );
}
