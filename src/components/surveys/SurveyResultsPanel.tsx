import Link from "next/link";

import { saveSurveyVisibilityFormAction } from "@/app/(app)/events/[eventId]/survey-actions";
import { OpenTextResponseList } from "@/components/surveys/OpenTextResponseList";
import { SurveyBarChart } from "@/components/surveys/SurveyBarChart";
import { Button } from "@/components/ui/Button";
import type { SurveyQuestionResult, SurveyResult } from "@/lib/surveys/results";

type SurveyResultsPanelProps = {
  eventId: string;
  results: SurveyResult[];
  selectedResultId?: string;
};

const statusLabels: Record<SurveyResult["status"], string> = {
  closed: "Closed",
  draft: "Draft",
  published: "Published",
};

function responseCopy(count: number) {
  return `${count} ${count === 1 ? "response" : "responses"}`;
}

function statusClasses(status: SurveyResult["status"]) {
  if (status === "published") return "border-teal-700 text-teal-700";
  if (status === "closed") return "border-slate-500 bg-slate-100 text-slate-700";
  return "border-slate-300 text-slate-700";
}

function visibilityClasses(visible: boolean) {
  return visible ? "border-teal-700 text-teal-700" : "border-amber-700 text-amber-700";
}

function ChartOrText({ question }: { question: SurveyQuestionResult }) {
  if (question.type === "open_text") {
    return <OpenTextResponseList responses={question.openTextResponses} title={question.prompt} />;
  }

  return <SurveyBarChart data={question.chartData} title={question.prompt} />;
}

export function SurveyResultsPanel({ eventId, results, selectedResultId }: SurveyResultsPanelProps) {
  const selected = results.find((result) => result.id === selectedResultId) ?? results[0];

  return (
    <section
      aria-labelledby="survey-results-heading"
      className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h2
          className="text-[20px] font-semibold leading-[1.25] text-slate-900"
          id="survey-results-heading"
        >
          Survey results
        </h2>
        <p className="text-sm leading-[1.4] text-slate-600">
          Organiser-only response counts, chart summaries, and open text data views.
        </p>
      </div>

      {results.length === 0 || !selected ? (
        <div className="rounded-[6px] border border-slate-300 bg-white p-4">
          <p className="text-base font-semibold leading-6 text-slate-900">No surveys yet</p>
          <p className="text-sm leading-[1.4] text-slate-600">
            Create and publish a survey before reviewing results.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          <div className="grid gap-3 border-b border-slate-200 pb-4">
            <h3 className="text-base font-semibold leading-6 text-slate-900">Survey selector</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {results.map((result) => (
                <Link
                  aria-current={result.id === selected.id ? "true" : undefined}
                  className={[
                    "grid gap-1 rounded-[6px] border bg-white p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
                    result.id === selected.id
                      ? "border-teal-700 text-slate-900"
                      : "border-slate-300 text-slate-900 hover:bg-slate-50",
                  ].join(" ")}
                  href={`/events/${eventId}?tab=results&resultSurveyId=${result.id}`}
                  key={result.id}
                >
                  <span className="break-words text-base font-semibold leading-6">{result.title}</span>
                  <span className="text-sm leading-[1.4] text-slate-600">
                    {responseCopy(result.responseCount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          <div className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-[20px] font-semibold leading-[1.25] text-slate-900">
                    {selected.title}
                  </h3>
                  <span
                    className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${statusClasses(
                      selected.status,
                    )}`}
                  >
                    {statusLabels[selected.status]}
                  </span>
                  <span
                    className={`rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${visibilityClasses(
                      selected.resultsVisibleToParticipants,
                    )}`}
                  >
                    {selected.resultsVisibleToParticipants ? "Results visible" : "Results hidden"}
                  </span>
                </div>
                <p className="mt-2 text-base font-semibold leading-6 text-slate-900">
                  {responseCopy(selected.responseCount)}
                </p>
                <p className="text-sm leading-[1.4] text-slate-600">
                  Last updated <time dateTime={selected.lastUpdated}>{new Date(selected.lastUpdated).toLocaleString()}</time>
                </p>
              </div>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold leading-6 text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
                href={selected.presentationHref}
                target="_blank"
              >
                Open presentation view
              </Link>
            </div>

            <form
              action={saveSurveyVisibilityFormAction.bind(null, eventId, selected.id)}
              className="grid gap-3 border-t border-slate-200 pt-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
            >
              <label className="grid gap-2 text-sm font-semibold leading-[1.4] text-slate-900">
                Participant result visibility
                <select
                  className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base font-normal leading-6 text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
                  defaultValue={selected.resultsVisibleToParticipants ? "true" : "false"}
                  name="results_visible_to_participants"
                >
                  <option value="false">Results hidden</option>
                  <option value="true">Results visible</option>
                </select>
              </label>
              <Button type="submit" variant="secondary">
                Save visibility
              </Button>
              <p className="text-sm leading-[1.4] text-slate-600 sm:col-span-2">
                Participants cannot see these results unless visibility is enabled.
              </p>
            </form>
          </div>

          <div className="grid gap-5">
            {selected.questions.map((question) => (
              <section
                aria-label={question.prompt}
                className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4"
                key={question.id}
              >
                <p className="text-sm font-semibold leading-[1.4] text-slate-600">
                  {responseCopy(question.responseCount)}
                </p>
                <ChartOrText question={question} />
              </section>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
