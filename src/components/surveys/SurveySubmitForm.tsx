"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

import {
  submitSurveyAction,
  type SubmitSurveyActionResult,
} from "@/app/join/[joinCode]/surveys/submit-actions";
import { Button } from "@/components/ui/Button";
import type { ParticipantSurvey } from "@/lib/surveys/participant";
import type { SurveyResult } from "@/lib/surveys/results";

type SurveySubmitFormProps = {
  completed: boolean;
  eventId: string;
  joinCode: string;
  result?: SurveyResult | null;
  resultsVisible: boolean;
  survey: ParticipantSurvey;
};

const initialState: SubmitSurveyActionResult = { ok: true, message: "" };

function ChartLoadingFallback() {
  return (
    <div
      aria-live="polite"
      className="rounded-[6px] border border-slate-200 bg-slate-50 p-3 text-sm font-semibold leading-[1.4] text-slate-700"
      role="status"
    >
      Loading chart...
    </div>
  );
}

const ParticipantSurveyBarChart = dynamic(
  () => import("@/components/surveys/SurveyBarChart").then((module) => module.SurveyBarChart),
  {
    loading: ChartLoadingFallback,
    ssr: false,
  },
);

function ratingValues(scale: 5 | 10 | null) {
  return Array.from({ length: scale ?? 5 }, (_, index) => index + 1);
}

export function SurveySubmitForm({
  completed,
  eventId,
  joinCode,
  result,
  resultsVisible,
  survey,
}: SurveySubmitFormProps) {
  const submitAction = submitSurveyAction.bind(null, eventId, joinCode);
  const [isCompleted, setIsCompleted] = useState(completed);

  async function submitAndComplete(
    previousState: SubmitSurveyActionResult,
    formData: FormData,
  ) {
    const result = await submitAction(previousState, formData);

    if (result.ok) {
      setIsCompleted(true);
    }

    return result;
  }

  const [state, formAction, isPending] = useActionState(submitAndComplete, initialState);

  if (isCompleted) {
    return (
      <section className="grid gap-4 rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7" aria-live="polite">
        <div className="rounded-[14px] border border-teal-100 bg-teal-50 p-3 text-[#00796B]" role="status">
          <p className="text-sm font-semibold leading-[1.4]">
            {state.message || "Survey submitted. Thank you. Your response has been recorded for this event."}
          </p>
        </div>
        <p className="inline-flex items-center gap-2 text-base font-semibold leading-6 text-slate-700">
          <CheckCircle2 aria-hidden="true" className="h-5 w-5 text-[#00796B]" />
          You have already submitted this survey.
        </p>
        {resultsVisible ? (
          result ? (
            <section className="grid gap-4 border-t border-slate-200 pt-4" aria-labelledby="participant-results-heading">
              <div className="grid gap-1">
                <h3
                  className="text-[22px] font-semibold leading-[1.2] text-slate-950"
                  id="participant-results-heading"
                >
                  Participant results
                </h3>
                <p className="text-base font-semibold leading-6 text-slate-900">
                  {result.responseCount} {result.responseCount === 1 ? "response" : "responses"}
                </p>
              </div>
              {result.questions
                .filter((question) => question.type !== "open_text")
                .map((question) => (
                  <ParticipantSurveyBarChart data={question.chartData} key={question.id} title={question.prompt} />
                ))}
            </section>
          ) : (
            <p className="text-base leading-6 text-slate-700">Survey results are available to participants.</p>
          )
        ) : (
          <p className="rounded-[14px] bg-amber-50 p-3 text-base font-semibold leading-6 text-amber-700">
            Results are hidden by the organiser.
          </p>
        )}
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <input name="surveyId" type="hidden" value={survey.id} />

      {state.message ? (
        <div
          className={`rounded-[14px] border p-3 ${
            state.ok ? "border-teal-100 bg-teal-50 text-[#00796B]" : "border-red-100 bg-red-50 text-red-700"
          }`}
          role={state.ok ? "status" : "alert"}
        >
          <p className="text-sm font-semibold leading-[1.4]">{state.message}</p>
        </div>
      ) : null}

      {survey.questions.map((question) => {
        const fieldName = `answers.${question.id}`;

        return (
          <fieldset className="grid gap-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0" key={question.id}>
            <legend className="text-[18px] font-semibold leading-7 text-slate-950">
              {question.prompt}
            </legend>

            {question.type === "multiple_choice" ? (
              <div className="grid gap-2">
                {question.options.map((option) => (
                  <label
                    className="flex min-h-12 items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 shadow-sm transition-colors hover:border-[#008578] hover:bg-teal-50/50"
                    key={option.id}
                  >
                    <input
                      className="h-5 w-5 accent-[#008578]"
                      name={fieldName}
                      required
                      type="radio"
                      value={option.id}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {question.type === "multiple_select" ? (
              <div className="grid gap-2">
                {question.options.map((option) => (
                  <label
                    className="flex min-h-12 items-center gap-3 rounded-[14px] border border-slate-200 bg-white px-4 py-3 text-base leading-6 text-slate-900 shadow-sm transition-colors hover:border-[#008578] hover:bg-teal-50/50"
                    key={option.id}
                  >
                    <input
                      className="h-5 w-5 accent-[#008578]"
                      name={fieldName}
                      type="checkbox"
                      value={option.id}
                    />
                    <span>{option.label}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {question.type === "rating" ? (
              <div className="flex flex-wrap gap-2">
                {ratingValues(question.ratingScale).map((value) => (
                  <label
                    className="flex min-h-12 min-w-14 items-center justify-center gap-2 rounded-[14px] border border-slate-200 bg-white px-3 text-base font-semibold leading-6 text-slate-900 shadow-sm transition-colors hover:border-[#008578] hover:bg-teal-50/50"
                    key={value}
                  >
                    <input
                      className="h-5 w-5 accent-[#008578]"
                      name={`${fieldName}.rating`}
                      required
                      type="radio"
                      value={value}
                    />
                    <span>{value}</span>
                  </label>
                ))}
              </div>
            ) : null}

            {question.type === "open_text" ? (
              <textarea
                aria-label={question.prompt}
                className="min-h-32 resize-y rounded-[14px] border border-slate-300 bg-white px-4 py-3 text-base leading-6 text-slate-950 outline-none transition-colors focus:border-[#008578] focus:ring-2 focus:ring-[#008578]/20"
                maxLength={2000}
                name={`${fieldName}.text`}
                required
              />
            ) : null}
          </fieldset>
        );
      })}

      {resultsVisible ? (
        <p className="text-sm leading-[1.4] text-slate-600">Survey results are available to participants.</p>
      ) : (
        <p className="rounded-[14px] bg-amber-50 p-3 text-sm font-semibold leading-[1.4] text-amber-700">
          Results are hidden by the organiser.
        </p>
      )}

      <Button
        className="rounded-[12px] bg-[#008578] px-6 shadow-sm hover:bg-[#00796B] focus-visible:ring-[#008578]"
        loading={isPending}
        type="submit"
      >
        Submit survey
      </Button>
    </form>
  );
}
