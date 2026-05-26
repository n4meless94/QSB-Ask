"use client";

import { useActionState, useState } from "react";

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

  return (
    <form action={formAction} className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4">
      {activeMessage ? (
        <div
          className={`rounded-[6px] border bg-white p-3 ${
            state.ok ? "border-teal-700 text-teal-700" : "border-red-700 text-red-700"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          <p className="text-sm font-semibold leading-[1.4]">{activeMessage}</p>
        </div>
      ) : null}

      <div className="grid gap-2">
        <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="question">
          Question
        </label>
        <textarea
          aria-describedby="question-count"
          className="min-h-32 resize-y rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
          id="question"
          maxLength={characterLimit}
          name="question"
          onChange={(event) => setQuestion(event.currentTarget.value)}
          value={question}
        />
        <p className="text-sm leading-[1.4] text-slate-600" id="question-count">
          {question.length} / {characterLimit}
        </p>
      </div>

      <Button loading={isPending} type="submit">
        Submit question
      </Button>
    </form>
  );
}
