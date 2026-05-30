import { createSurveyFormAction } from "@/app/(app)/events/[eventId]/survey-actions";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";
import type { SurveySummary } from "@/lib/surveys/management";

type SurveyListProps = {
  eventId: string;
  selectedSurveyId?: string;
  surveys: SurveySummary[];
};

const statusLabels: Record<SurveySummary["status"], string> = {
  closed: "Closed",
  draft: "Draft",
  published: "Published",
};

function statusClasses(status: SurveySummary["status"]) {
  if (status === "published") return "border-teal-700 text-teal-700";
  if (status === "closed") return "border-slate-500 bg-slate-100 text-slate-700";
  return "border-slate-300 text-slate-700";
}

export function SurveyList({ eventId, selectedSurveyId, surveys }: SurveyListProps) {
  const createAction = createSurveyFormAction.bind(null, eventId);

  return (
    <aside aria-labelledby="survey-list-heading" className="grid gap-4">
      <div className="grid gap-1">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900" id="survey-list-heading">
          Surveys
        </h2>
        <p className="text-sm leading-[1.4] text-slate-600">
          Draft, publish, close, and control participant result visibility.
        </p>
      </div>

      <form action={createAction} className="grid gap-3 border-b border-slate-200 pb-4">
        <Field label="New survey title" name="title" type="text" />
        <Button type="submit">Create survey</Button>
      </form>

      <div className="grid gap-3">
        {surveys.length === 0 ? (
          <div className="rounded-[6px] border border-slate-300 bg-white p-4">
            <p className="text-base font-semibold leading-6 text-slate-900">No surveys yet</p>
            <p className="mt-1 text-sm leading-[1.4] text-slate-600">
              Create a draft survey before adding questions.
            </p>
          </div>
        ) : (
          surveys.map((survey) => (
            <div
              className={[
                "grid gap-2 rounded-[6px] border bg-white p-4",
                survey.id === selectedSurveyId ? "border-teal-700" : "border-slate-300",
              ].join(" ")}
              key={survey.id}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="min-w-0 break-words text-base font-semibold leading-6 text-slate-900">
                  {survey.title}
                </p>
                <span
                  className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${statusClasses(
                    survey.status,
                  )}`}
                >
                  {statusLabels[survey.status]}
                </span>
              </div>
              <p className="text-sm leading-[1.4] text-slate-600">
                {survey.questions.length} {survey.questions.length === 1 ? "question" : "questions"}
              </p>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
