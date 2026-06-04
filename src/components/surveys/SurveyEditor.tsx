"use client";

import { useActionState, useMemo, useState } from "react";

import {
  closeSurveyAction,
  publishSurveyAction,
  saveSurveyDraftAction,
  saveSurveyVisibilityAction,
} from "@/app/(app)/events/[eventId]/survey-actions";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import { validateSurveyForPublish, type SurveyQuestionDraft } from "@/lib/surveys/validation";
import type { SurveyMutationResult, SurveySummary } from "@/lib/surveys/management";
import type { SurveyQuestionType } from "@/types/app";

type SurveyEditorProps = {
  eventId: string;
  survey?: SurveySummary;
};

type EditableQuestion = SurveyQuestionDraft & {
  key: string;
};

const initialActionState: SurveyMutationResult = { message: "", ok: true };

const questionTypeLabels: Record<SurveyQuestionType, string> = {
  multiple_choice: "Multiple choice",
  multiple_select: "Multiple select",
  open_text: "Open text",
  rating: "Rating",
};

const statusLabels: Record<SurveySummary["status"], string> = {
  closed: "Closed",
  draft: "Draft",
  published: "Published",
};

function questionFromSurvey(question: SurveySummary["questions"][number]): EditableQuestion {
  return {
    id: question.id,
    key: question.id,
    options: question.options.map((option) => option.label),
    prompt: question.prompt,
    ratingScale: question.ratingScale ?? 5,
    type: question.type,
  };
}

function newQuestion(index: number): EditableQuestion {
  return {
    key: `new-${Date.now()}-${index}`,
    options: ["Yes", "No"],
    prompt: "",
    ratingScale: 5,
    type: "multiple_choice",
  };
}

function statusClasses(status: SurveySummary["status"]) {
  if (status === "published") return "border-teal-700 bg-teal-50 text-teal-800";
  if (status === "closed") return "border-slate-500 bg-slate-100 text-slate-700";
  return "border-slate-300 text-slate-700";
}

function lifecycleCopy(survey: SurveySummary) {
  if (survey.status === "published") {
    return "Published and accepting responses.";
  }

  if (survey.status === "closed") {
    return "Closed. Participants can no longer submit responses.";
  }

  return "Draft. Participants cannot answer until this survey is published.";
}

function updateQuestion(
  questions: EditableQuestion[],
  index: number,
  patch: Partial<EditableQuestion>,
) {
  return questions.map((question, questionIndex) =>
    questionIndex === index ? { ...question, ...patch } : question,
  );
}

export function SurveyEditor({ eventId, survey }: SurveyEditorProps) {
  async function saveAction(_previousState: SurveyMutationResult, formData: FormData) {
    return saveSurveyDraftAction(eventId, formData);
  }

  async function publishAction(_previousState: SurveyMutationResult, formData: FormData) {
    return publishSurveyAction(eventId, formData);
  }

  async function closeStateAction(previousState: SurveyMutationResult) {
    void previousState;
    if (!survey) return { message: "Create a survey before closing it.", ok: false };
    return closeSurveyAction(eventId, survey.id);
  }

  async function visibilityStateAction(_previousState: SurveyMutationResult, formData: FormData) {
    if (!survey) return { message: "Create a survey before changing visibility.", ok: false };
    return saveSurveyVisibilityAction(eventId, survey.id, formData);
  }

  const [saveState, saveFormAction, isSaving] = useActionState(saveAction, initialActionState);
  const [publishState, publishFormAction, isPublishing] = useActionState(
    publishAction,
    initialActionState,
  );
  const [closeState, closeFormAction, isClosing] = useActionState(
    closeStateAction,
    initialActionState,
  );
  const [visibilityState, visibilityFormAction, isSavingVisibility] = useActionState(
    visibilityStateAction,
    initialActionState,
  );
  const [title, setTitle] = useState(survey?.title ?? "");
  const [questions, setQuestions] = useState<EditableQuestion[]>(
    () => survey?.questions.map(questionFromSurvey) ?? [],
  );

  const validation = useMemo(
    () =>
      survey
        ? validateSurveyForPublish({
            questions,
            surveyId: survey.id,
            title,
          })
        : { errors: {}, ok: false },
    [questions, survey, title],
  );

  if (!survey) {
    return (
      <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">Survey editor</h2>
        <p className="text-base leading-6 text-slate-700">
          Create a survey draft to start adding questions.
        </p>
      </section>
    );
  }

  const actionState = [publishState, saveState, closeState, visibilityState].find(
    (state) => !state.ok || state.message,
  );
  const validationErrors = validation.errors.questions ?? [];

  return (
    <section
      aria-labelledby="survey-editor-heading"
      className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2
              className="text-[20px] font-semibold leading-[1.25] text-slate-900"
              id="survey-editor-heading"
            >
              Survey editor
            </h2>
            <span
              className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${statusClasses(
                survey.status,
              )}`}
            >
              {statusLabels[survey.status]}
            </span>
          </div>
          <p className="text-sm leading-[1.4] text-slate-600">
            {lifecycleCopy(survey)}
          </p>
        </div>

        <form action={closeFormAction}>
          <Button
            disabled={survey.status === "closed"}
            loading={isClosing}
            type="submit"
            variant="secondary"
          >
            Close survey
          </Button>
        </form>
      </div>

      <div
        className={[
          "rounded-[6px] border p-3 text-sm leading-[1.5]",
          survey.status === "published"
            ? "border-teal-700 bg-teal-50 text-teal-950"
            : survey.status === "closed"
              ? "border-slate-400 bg-slate-50 text-slate-800"
              : "border-amber-700 bg-amber-50 text-amber-950",
        ].join(" ")}
        role="status"
      >
        <p className="font-semibold">{lifecycleCopy(survey)}</p>
        <p>
          Participant results are{" "}
          <span className="font-semibold">
            {survey.results_visible_to_participants ? "visible" : "hidden"}
          </span>
          .
        </p>
      </div>

      {actionState?.message ? (
        <Alert title={actionState.ok ? "Survey saved" : actionState.message} variant={actionState.ok ? "info" : "destructive"}>
          {actionState.ok ? actionState.message : "Review the highlighted survey details and try again."}
        </Alert>
      ) : null}

      {!validation.ok ? (
        <Alert title="Survey is not ready to publish" variant="warning">
          {validationErrors.length > 0 ? (
            <ul className="grid gap-1">
              {validationErrors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          ) : (
            <p>Complete the survey title and add at least one question.</p>
          )}
        </Alert>
      ) : null}

      <form
        action={visibilityFormAction}
        className="grid gap-3 rounded-[6px] border border-slate-300 bg-slate-50 p-3"
      >
        <label className="flex items-start gap-3 text-sm font-semibold leading-[1.4] text-slate-900">
          <input
            className="mt-1 size-5 rounded border-slate-300 text-teal-700 focus:ring-2 focus:ring-teal-700"
            defaultChecked={survey.results_visible_to_participants}
            name="results_visible_to_participants"
            type="checkbox"
            value="true"
          />
          <span>
            Participant results: {survey.results_visible_to_participants ? "Visible" : "Hidden"}
            <span className="block pt-1 text-sm font-normal leading-[1.4] text-slate-600">
              Keep hidden until organisers are ready for participants to see the live result view.
            </span>
          </span>
        </label>
        <div>
          <Button loading={isSavingVisibility} type="submit" variant="secondary">
            Save visibility
          </Button>
        </div>
      </form>

      <form action={saveFormAction} className="grid gap-5">
        <input name="surveyId" type="hidden" value={survey.id} />
        <input name="questionCount" type="hidden" value={questions.length} />
        <Field
          label="Survey title"
          name="title"
          onChange={(event) => setTitle(event.target.value)}
          type="text"
          value={title}
        />

        <div className="grid gap-4">
          {questions.map((question, index) => (
            <fieldset
              className="grid gap-4 rounded-[6px] border border-slate-300 bg-slate-50 p-4"
              key={question.key}
            >
              <legend className="rounded-[6px] bg-white px-2 text-base font-semibold leading-6 text-slate-900">
                Question {index + 1}
              </legend>
              <input name={`questions.${index}.id`} type="hidden" value={question.id ?? ""} />
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold leading-[1.4] text-slate-900"
                    htmlFor={`questions-${index}-type`}
                  >
                    Question type
                  </label>
                  <select
                    className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
                    id={`questions-${index}-type`}
                    name={`questions.${index}.type`}
                    onChange={(event) =>
                      setQuestions(
                        updateQuestion(questions, index, {
                          options:
                            event.target.value === "multiple_choice" ||
                            event.target.value === "multiple_select"
                              ? question.options && question.options.length >= 2
                                ? question.options
                                : ["Yes", "No"]
                              : [],
                          type: event.target.value as SurveyQuestionType,
                        }),
                      )
                    }
                    value={question.type}
                  >
                    {Object.entries(questionTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <Field
                  label="Prompt"
                  name={`questions.${index}.prompt`}
                  onChange={(event) =>
                    setQuestions(updateQuestion(questions, index, { prompt: event.target.value }))
                  }
                  type="text"
                  value={question.prompt}
                />
              </div>

              {question.type === "multiple_choice" || question.type === "multiple_select" ? (
                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold leading-[1.4] text-slate-900"
                    htmlFor={`questions-${index}-options`}
                  >
                    Answer options
                  </label>
                  <textarea
                    className="min-h-28 rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                    id={`questions-${index}-options`}
                    name={`questions.${index}.options`}
                    onChange={(event) =>
                      setQuestions(
                        updateQuestion(questions, index, {
                          options: event.target.value.split("\n"),
                        }),
                      )
                    }
                    value={(question.options ?? []).join("\n")}
                  />
                </div>
              ) : null}

              {question.type === "rating" ? (
                <div className="grid gap-2">
                  <label
                    className="text-sm font-semibold leading-[1.4] text-slate-900"
                    htmlFor={`questions-${index}-rating`}
                  >
                    Rating scale
                  </label>
                  <select
                    className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
                    id={`questions-${index}-rating`}
                    name={`questions.${index}.ratingScale`}
                    onChange={(event) =>
                      setQuestions(
                        updateQuestion(questions, index, {
                          ratingScale: Number(event.target.value),
                        }),
                      )
                    }
                    value={question.ratingScale ?? 5}
                  >
                    <option value="5">5 points</option>
                    <option value="10">10 points</option>
                  </select>
                </div>
              ) : (
                <input name={`questions.${index}.ratingScale`} type="hidden" value="5" />
              )}
            </fieldset>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-between">
          <Button
            onClick={() => setQuestions([...questions, newQuestion(questions.length)])}
            type="button"
            variant="secondary"
          >
            Add question
          </Button>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button loading={isSaving} type="submit" variant="secondary">
              Save draft
            </Button>
            <Button
              disabled={!validation.ok || isPublishing || survey.status === "closed"}
              formAction={publishFormAction}
              type="submit"
            >
              {survey.status === "published" ? "Update published survey" : "Publish survey"}
            </Button>
          </div>
        </div>
      </form>
    </section>
  );
}
