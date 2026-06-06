"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Maximize2, Minimize2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import { ConnectionStatus } from "@/components/qna/ConnectionStatus";
import type { SurveyChartDatum, SurveyQuestionResult, SurveyResult } from "@/lib/surveys/results";
import { subscribeToSurveyResults, type SurveyConnectionState } from "@/lib/surveys/realtime";

type SurveyPresentationViewProps = {
  eventId: string;
  eventName: string;
  fixtureMode?: boolean;
  joinCode: string;
  joinLink: string;
  result: SurveyResult;
};

type ChartMode = "treemap" | "bar";

function responseCopy(count: number) {
  return `${count} ${count === 1 ? "response" : "responses"}`;
}

function displayJoinLink(joinLink: string) {
  try {
    const url = new URL(joinLink);
    return `${url.host}${url.pathname}`;
  } catch {
    return joinLink.replace(/^https?:\/\//, "");
  }
}

function chartGradient(index: number) {
  const gradients = [
    "from-[#0F959B] via-[#2E7BE6] to-[#6D3FDC]",
    "from-[#0B7D77] via-[#2A86D9] to-[#4E54D8]",
    "from-[#138C8C] via-[#2876D9] to-[#6E45D7]",
    "from-[#006B66] via-[#1D80C3] to-[#5F3ED2]",
  ];

  return gradients[index % gradients.length];
}

function AccessibleResults({ data, title }: { data: SurveyChartDatum[]; title: string }) {
  return (
    <div className="sr-only">
      <ul>
        {data.map((datum) => (
          <li key={datum.label}>
            {datum.label}: {responseCopy(datum.count)}, {datum.percentage}%
          </li>
        ))}
      </ul>
      <table aria-label={`${title} data`}>
        <caption>{title} data</caption>
        <thead>
          <tr>
            <th scope="col">Label</th>
            <th scope="col">Count</th>
            <th scope="col">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((datum) => (
            <tr key={datum.label}>
              <th scope="row">{datum.label}</th>
              <td>{datum.count}</td>
              <td>{datum.percentage}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function NoResponsesPanel() {
  return (
    <div className="grid min-h-[220px] place-items-center rounded-[8px] border border-[#7AB8BD] bg-white/40 px-8 text-center text-[#006B66] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <div className="grid gap-3">
        <p className="text-[28px] font-bold leading-[1.15]">No responses yet</p>
        <p className="text-[18px] font-semibold leading-[1.4]">
          Results will appear here when participants submit responses.
        </p>
      </div>
    </div>
  );
}

function TreemapResults({ question }: { question: SurveyQuestionResult }) {
  const hasResponses = question.chartData.some((datum) => datum.count > 0);

  if (!hasResponses) return <NoResponsesPanel />;

  return (
    <div className="grid gap-5 md:grid-cols-2">
      {question.chartData.map((datum, index) => (
        <article
          className={`grid min-h-[220px] place-items-center rounded-[8px] bg-gradient-to-br ${chartGradient(
            index,
          )} px-6 py-8 text-center text-white shadow-[0_18px_44px_rgba(15,82,124,0.18)]`}
          key={datum.label}
        >
          <div className="grid gap-4">
            <p className="text-[clamp(2.5rem,5vw,4.4rem)] font-bold leading-none">
              {datum.percentage}%
            </p>
            <h3 className="break-words text-[clamp(1.25rem,2vw,2rem)] font-bold uppercase leading-[1.18]">
              {datum.label}
            </h3>
          </div>
        </article>
      ))}
      <AccessibleResults data={question.chartData} title={question.prompt} />
    </div>
  );
}

function BarResults({ question }: { question: SurveyQuestionResult }) {
  const maxPercentage = Math.max(...question.chartData.map((datum) => datum.percentage), 1);
  const hasResponses = question.chartData.some((datum) => datum.count > 0);

  if (!hasResponses) return <NoResponsesPanel />;

  return (
    <div aria-label={`${question.prompt} chart`} className="grid gap-8" role="img">
      {question.chartData.map((datum, index) => (
        <div className="grid items-center gap-5 md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)_90px]" key={datum.label}>
          <h3 className="break-words text-[clamp(1.25rem,1.9vw,1.8rem)] font-bold uppercase leading-[1.18] text-[#006B66]">
            {datum.label}
          </h3>
          <div className="h-[34px] overflow-hidden rounded-[6px] bg-white/35">
            <div
              className={`h-full rounded-[6px] bg-gradient-to-r ${chartGradient(index)}`}
              style={{ width: `${Math.max((datum.percentage / maxPercentage) * 100, 3)}%` }}
            />
          </div>
          <p className="text-[clamp(1.5rem,2.2vw,2.25rem)] font-bold leading-none text-[#006B66]">
            {datum.percentage}%
          </p>
        </div>
      ))}
      <AccessibleResults data={question.chartData} title={question.prompt} />
    </div>
  );
}

function ChartGroup({ mode, question }: { mode: ChartMode; question: SurveyQuestionResult }) {
  if (question.type === "open_text") {
    return (
      <section className="grid gap-4">
        <h2 className="break-words text-[clamp(2rem,3.4vw,3.8rem)] font-bold uppercase leading-[1.12] text-[#006B66]">
          {question.prompt}
        </h2>
        <p className="max-w-3xl text-[22px] font-semibold leading-[1.35] text-[#006B66]">
          Open text responses are available to organisers in the Results workspace.
        </p>
      </section>
    );
  }

  return (
    <section className="grid gap-14">
      <h2 className="break-words text-[clamp(2rem,3.4vw,3.8rem)] font-bold uppercase leading-[1.12] text-[#006B66]">
        {question.prompt}
      </h2>
      {mode === "treemap" ? <TreemapResults question={question} /> : <BarResults question={question} />}
    </section>
  );
}

export function SurveyPresentationView({
  eventId,
  eventName,
  fixtureMode = false,
  joinCode,
  joinLink,
  result,
}: SurveyPresentationViewProps) {
  const router = useRouter();
  const [connectionState, setConnectionState] = useState<SurveyConnectionState>("live");
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mode, setMode] = useState<ChartMode>("treemap");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [resultState, setResultState] = useState(result);
  const questions = resultState.questions;
  const activeQuestionIndex = Math.min(questionIndex, Math.max(questions.length - 1, 0));
  const activeQuestion = questions[activeQuestionIndex];

  useEffect(() => {
    if (fixtureMode) {
      function refreshFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ result?: SurveyResult }>).detail;

        if (detail?.result) {
          setResultState(detail.result);
          setConnectionState("live");
        }
      }

      function connectionFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ state?: SurveyConnectionState }>).detail;

        if (detail?.state) {
          setConnectionState(detail.state);
        }
      }

      window.addEventListener("qsb-ask:e2e-survey-results-refresh", refreshFromFixture);
      window.addEventListener("qsb-ask:e2e-survey-connection", connectionFromFixture);
      document.body.dataset.surveyPresentationReady = "true";
      return () => {
        window.removeEventListener("qsb-ask:e2e-survey-results-refresh", refreshFromFixture);
        window.removeEventListener("qsb-ask:e2e-survey-connection", connectionFromFixture);
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

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  async function copyJoinLink() {
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  }

  function previousQuestion() {
    setQuestionIndex((current) => Math.max(current - 1, 0));
  }

  function nextQuestion() {
    setQuestionIndex((current) => Math.min(current + 1, questions.length - 1));
  }

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-[linear-gradient(135deg,#35D3CE_0%,#DDF7F4_24%,#CFE7F7_66%,#3F8EE7_100%)] text-[#006B66]">
      <header className="grid h-11 grid-cols-[minmax(0,1fr)_auto] items-center border-b border-white/45 bg-white/82 px-4 text-[13px] font-semibold text-[#334155]">
        <div className="flex min-w-0 items-center gap-2">
          <span aria-hidden="true" className="grid size-4 place-items-center rounded-[3px] border border-[#64748B]" />
          <h1 className="truncate">Present</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            aria-pressed={isFullscreen}
            className="grid size-8 place-items-center rounded-[6px] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#006B66]"
            onClick={toggleFullscreen}
            type="button"
          >
            {isFullscreen ? <Minimize2 aria-hidden="true" size={17} /> : <Maximize2 aria-hidden="true" size={17} />}
          </button>
        </div>
      </header>

      <div className="grid h-[calc(100vh-44px)] place-items-center px-4 py-8 sm:px-8 lg:px-12">
        <section className="grid h-full max-h-[900px] w-full max-w-[1640px] overflow-hidden rounded-[8px] bg-[#DDF4F3]/82 shadow-[0_24px_70px_rgba(15,82,124,0.28)] lg:grid-cols-[330px_minmax(0,1fr)]">
          <aside className="relative hidden bg-[#A8D4D2]/70 px-10 py-12 text-center lg:grid lg:grid-rows-[auto_minmax(0,1fr)_auto]">
            <ConnectionStatus onRefresh={() => router.refresh()} state={connectionState} />
            <div className="grid content-center gap-8">
              <p className="text-[24px] font-bold leading-[1.25]">
                Scan the QR or use link to join
              </p>
              <div className="mx-auto grid size-[220px] place-items-center rounded-[8px] bg-white p-4 shadow-[0_16px_32px_rgba(0,107,102,0.12)]">
                <QRCodeCanvas
                  bgColor="#ffffff"
                  fgColor="#020617"
                  level="M"
                  marginSize={2}
                  size={188}
                  title={`QR code for ${eventName} survey join link`}
                  value={joinLink}
                />
              </div>
              <div className="grid gap-4">
                <p aria-label="Join link" className="break-words text-[20px] font-bold leading-[1.35]">
                  {displayJoinLink(joinLink)}
                </p>
                <button
                  className="mx-auto inline-flex min-h-11 items-center justify-center gap-3 rounded-[6px] px-3 text-[18px] font-bold outline-none hover:bg-white/40 focus-visible:ring-2 focus-visible:ring-[#006B66]"
                  onClick={copyJoinLink}
                  type="button"
                >
                  <Copy aria-hidden="true" size={24} />
                  {copied ? "Copied" : "Copy link"}
                </button>
                <p aria-label="Join code" className="text-[16px] font-bold leading-none">
                  {joinCode}
                </p>
              </div>
            </div>
            <div aria-hidden="true" />
          </aside>

          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] px-6 py-8 sm:px-10 lg:px-20 lg:py-12">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-6">
              <div className="min-w-0">
                <p className="sr-only">{eventName} survey presentation</p>
                <h2 className="break-words text-[clamp(2rem,3vw,3.6rem)] font-bold uppercase leading-[1.12]">
                  {resultState.title}
                </h2>
              </div>
              <p className="hidden whitespace-nowrap text-[24px] font-bold leading-none md:block">
                {responseCopy(resultState.responseCount)} submitted
              </p>
            </div>

            <div className="grid min-h-0 content-center py-8">
              {activeQuestion ? <ChartGroup mode={mode} question={activeQuestion} /> : <NoResponsesPanel />}
            </div>

            <footer className="grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
              <div className="flex justify-center sm:justify-start">
                <div className="grid w-[260px] grid-cols-2 rounded-full bg-white p-1 shadow-[0_12px_26px_rgba(15,82,124,0.10)]">
                  {(["treemap", "bar"] as const).map((option) => (
                    <button
                      aria-pressed={mode === option}
                      className={[
                        "min-h-11 rounded-full px-4 text-[18px] font-semibold leading-none outline-none focus-visible:ring-2 focus-visible:ring-[#006B66]",
                        mode === option ? "bg-[#007C78] text-white" : "text-[#007C78] hover:bg-[#E8F8F6]",
                      ].join(" ")}
                      key={option}
                      onClick={() => setMode(option)}
                      type="button"
                    >
                      {option === "treemap" ? "Treemap" : "Bar"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 text-[20px] font-semibold">
                <button
                  aria-label="Previous question"
                  className="grid size-12 place-items-center rounded-[6px] border border-[#007C78] outline-none disabled:cursor-not-allowed disabled:border-[#9ACBCB] disabled:text-[#9ACBCB] focus-visible:ring-2 focus-visible:ring-[#006B66]"
                  disabled={questionIndex === 0}
                  onClick={previousQuestion}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" size={28} />
                </button>
                <span>
                  {questions.length === 0 ? 0 : activeQuestionIndex + 1} of {questions.length}
                </span>
                <button
                  aria-label="Next question"
                  className="grid size-12 place-items-center rounded-[6px] border border-[#007C78] outline-none disabled:cursor-not-allowed disabled:border-[#9ACBCB] disabled:text-[#9ACBCB] focus-visible:ring-2 focus-visible:ring-[#006B66]"
                  disabled={questionIndex >= questions.length - 1}
                  onClick={nextQuestion}
                  type="button"
                >
                  <ChevronRight aria-hidden="true" size={28} />
                </button>
              </div>

              <div className="flex justify-center lg:hidden sm:justify-end">
                <p className="break-words text-sm font-bold leading-[1.35]">{displayJoinLink(joinLink)}</p>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
