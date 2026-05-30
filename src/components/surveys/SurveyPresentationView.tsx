"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ConnectionStatus } from "@/components/qna/ConnectionStatus";
import { SurveyBarChart } from "@/components/surveys/SurveyBarChart";
import type { SurveyQuestionResult, SurveyResult } from "@/lib/surveys/results";
import { subscribeToSurveyResults, type SurveyConnectionState } from "@/lib/surveys/realtime";

type SurveyPresentationViewProps = {
  eventId: string;
  eventName: string;
  fixtureMode?: boolean;
  result: SurveyResult;
};

function responseCopy(count: number) {
  return `${count} ${count === 1 ? "response" : "responses"}`;
}

function ChartGroup({ question }: { question: SurveyQuestionResult }) {
  if (question.type === "open_text") {
    return (
      <section className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
        <h3 className="break-words text-[20px] font-semibold leading-[1.25] text-slate-900 md:text-[28px] md:leading-[1.2]">
          {question.prompt}
        </h3>
        <p className="text-base leading-6 text-slate-700">
          Open text responses are available to organisers in the Results workspace.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6">
      <p className="text-sm font-semibold leading-[1.4] text-slate-600">
        {responseCopy(question.responseCount)}
      </p>
      <SurveyBarChart data={question.chartData} title={question.prompt} />
    </section>
  );
}

export function SurveyPresentationView({
  eventId,
  eventName,
  fixtureMode = false,
  result,
}: SurveyPresentationViewProps) {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<SurveyConnectionState>("live");
  const [resultState, setResultState] = useState(result);

  useEffect(() => {
    if (fixtureMode) {
      function refreshFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ result?: SurveyResult }>).detail;

        if (detail?.result) {
          setResultState(detail.result);
          setConnectionState("live");
        }
      }

      window.addEventListener("qsb-ask:e2e-survey-results-refresh", refreshFromFixture);
      document.body.dataset.surveyPresentationReady = "true";
      return () => {
        window.removeEventListener("qsb-ask:e2e-survey-results-refresh", refreshFromFixture);
        delete document.body.dataset.surveyPresentationReady;
      };
    }

    return subscribeToSurveyResults({
      eventId,
      onConnectionChange: setConnectionState,
      onRefresh: () => router.refresh(),
      surveyId: result.id,
    });
  }, [eventId, fixtureMode, result.id, router]);

  return (
    <div className="grid gap-6 bg-slate-50 text-slate-900">
      <header className="grid gap-4 border-b border-slate-300 pb-5">
        <ConnectionStatus state={connectionState} />
        <div className="grid gap-2">
          <h1 className="break-words text-[28px] font-semibold leading-[1.2] text-slate-950">
            {eventName} survey presentation
          </h1>
          <h2 className="break-words text-[28px] font-semibold leading-[1.2] text-slate-900">
            {resultState.title}
          </h2>
          <p className="text-[20px] font-semibold leading-[1.25] text-slate-700">
            {responseCopy(resultState.responseCount)}
          </p>
        </div>
      </header>

      {resultState.responseCount === 0 ? (
        <section className="rounded-[6px] border border-amber-700 bg-white p-5" role="status">
          <h2 className="text-[20px] font-semibold leading-[1.25] text-amber-700">
            No survey results yet
          </h2>
          <p className="mt-2 text-base leading-6 text-slate-700">
            Results will appear here when participants submit responses.
          </p>
        </section>
      ) : null}

      <div className="grid gap-6">
        {resultState.questions.map((question) => (
          <ChartGroup key={question.id} question={question} />
        ))}
      </div>
    </div>
  );
}
