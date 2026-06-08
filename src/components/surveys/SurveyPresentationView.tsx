"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Copy, Maximize2, Minimize2 } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

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

type ChartMode = "tiles" | "bar";

function responseCopy(count: number) {
  return `${count} ${count === 1 ? "response" : "responses"}`;
}

function displayJoinLink(joinLink: string) {
  try {
    const url = new URL(joinLink);
    return url.host;
  } catch {
    return joinLink.replace(/^https?:\/\//, "").split("/")[0] || joinLink;
  }
}

function connectionCopy(state: SurveyConnectionState) {
  if (state === "live") return "Connected";
  if (state === "reconnecting") return "Reconnecting";
  if (state === "offline") return "Offline";
  return "Refresh needed";
}

function connectionDetail(state: SurveyConnectionState) {
  if (state === "reconnecting") return "Reconnecting. Live updates may be delayed.";
  if (state === "offline") return "You are offline. Live updates will resume when the connection returns.";
  if (state === "refresh-needed") return "Live updates are not reconnecting. Refresh this view to continue.";
  return "";
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

function lowResponseCopy(count: number) {
  if (count === 0) return null;
  if (count === 1) return "Early signal: 1 response so percentages may swing quickly.";
  if (count < 5) return `Early signal: ${count} responses so percentages may still shift.`;
  return null;
}

function tileLabelSize(label: string) {
  if (label.length > 120) return "text-[clamp(0.78rem,min(1.15vw,1.55vh),1.18rem)]";
  if (label.length > 82) return "text-[clamp(0.86rem,min(1.3vw,1.75vh),1.35rem)]";
  if (label.length > 52) return "text-[clamp(0.95rem,min(1.55vw,2vh),1.55rem)]";
  return "text-[clamp(1.05rem,min(2vw,2.6vh),2rem)]";
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
    <div className="grid h-full min-h-[clamp(7rem,18vh,13.75rem)] place-items-center rounded-[8px] border border-[#7AB8BD] bg-white/40 px-8 text-center text-[#006B66] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
      <div className="grid gap-3">
        <p className="text-[28px] font-bold leading-[1.15]">No responses yet</p>
        <p className="text-[18px] font-semibold leading-[1.4]">
          Results will appear here when participants submit responses.
        </p>
      </div>
    </div>
  );
}

function LowResponseNote({ count }: { count: number }) {
  const copy = lowResponseCopy(count);

  if (!copy) return null;

  return (
    <p className="rounded-[6px] border border-[#7AB8BD] bg-white/42 px-4 py-2 text-[clamp(0.85rem,1.4vh,1rem)] font-semibold leading-[1.35] text-[#006B66]">
      {copy}
    </p>
  );
}

function TilesResults({ question }: { question: SurveyQuestionResult }) {
  const hasResponses = question.chartData.some((datum) => datum.count > 0);

  if (!hasResponses) {
    return (
      <>
        <NoResponsesPanel />
        <AccessibleResults data={question.chartData} title={question.prompt} />
      </>
    );
  }

  return (
    <div className="grid h-full min-h-0 content-stretch gap-[clamp(0.75rem,1.6vh,1.25rem)] md:grid-cols-2">
      {question.chartData.map((datum, index) => (
        <article
          className={`grid min-h-[clamp(7rem,16vh,13.75rem)] min-w-0 overflow-hidden rounded-[8px] bg-gradient-to-br ${chartGradient(
            index,
          )} px-[clamp(1rem,1.8vw,1.5rem)] py-[clamp(0.75rem,2.1vh,1.65rem)] text-center text-white shadow-[0_18px_44px_rgba(15,82,124,0.18)]`}
          data-testid="survey-result-tile"
          key={datum.label}
        >
          <div className="grid h-full min-h-0 w-full place-content-center gap-[clamp(0.45rem,1.1vh,0.85rem)]">
            <p className="text-[clamp(1.9rem,min(4.3vw,5.8vh),3.75rem)] font-bold leading-none">
              {datum.percentage}%
            </p>
            <h3
              className={[
                "max-w-full break-words font-bold uppercase leading-[1.12] [overflow-wrap:anywhere] [text-wrap:balance]",
                tileLabelSize(datum.label),
              ].join(" ")}
            >
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

  if (!hasResponses) {
    return (
      <>
        <NoResponsesPanel />
        <AccessibleResults data={question.chartData} title={question.prompt} />
      </>
    );
  }

  return (
    <div
      aria-label={`${question.prompt} chart`}
      className="grid min-w-0 gap-[clamp(0.75rem,2.1vh,1.65rem)]"
      role="img"
    >
      {question.chartData.map((datum, index) => (
        <div
          className="grid min-w-0 items-center gap-[clamp(0.5rem,1.4vw,1.25rem)] md:grid-cols-[minmax(0,0.68fr)_minmax(0,1.32fr)_minmax(3.5rem,auto)]"
          data-testid="survey-result-bar-row"
          key={datum.label}
        >
          <h3 className="min-w-0 break-words text-[clamp(0.95rem,min(1.55vw,2.05vh),1.55rem)] font-bold uppercase leading-[1.14] text-[#006B66] [overflow-wrap:anywhere]">
            {datum.label}
          </h3>
          <div className="min-w-0 h-[clamp(1.35rem,3.2vh,1.95rem)] overflow-hidden rounded-[6px] bg-white/35">
            <div
              className={`h-full rounded-[6px] bg-gradient-to-r ${chartGradient(index)}`}
              style={{ width: `${Math.max((datum.percentage / maxPercentage) * 100, 3)}%` }}
            />
          </div>
          <p className="justify-self-end font-mono text-[clamp(1.1rem,min(1.85vw,2.35vh),1.95rem)] font-bold leading-none tracking-normal text-[#006B66]">
            {datum.percentage}%
          </p>
        </div>
      ))}
      <AccessibleResults data={question.chartData} title={question.prompt} />
    </div>
  );
}

function cloudSize(count: number, maxCount: number) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  const fluid = `min(${1.2 + ratio * 3.8}vw, ${1.6 + ratio * 4.8}vh)`;
  return `clamp(1.2rem, ${fluid}, ${2.2 + ratio * 3.9}rem)`;
}

function cloudWeight(count: number, maxCount: number) {
  const ratio = maxCount > 0 ? count / maxCount : 0;
  return Math.round(650 + ratio * 200);
}

function OpenTextWordCloud({ question }: { question: SurveyQuestionResult }) {
  if (question.responseCount === 0) return <NoResponsesPanel />;

  if (question.openTextKeywords.length === 0) {
    return (
      <div className="grid h-full min-h-[clamp(8rem,22vh,16.25rem)] place-items-center rounded-[8px] border border-[#7AB8BD] bg-white/42 px-8 text-center text-[#006B66] shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]">
        <div className="grid gap-3">
          <p className="text-[clamp(1.75rem,min(4vw,5vh),4rem)] font-bold leading-none">
            {responseCopy(question.responseCount)} collected
          </p>
          <p className="text-[20px] font-semibold leading-[1.35]">
            Keywords will appear as repeated themes emerge.
          </p>
        </div>
      </div>
    );
  }

  const maxCount = Math.max(...question.openTextKeywords.map((keyword) => keyword.count), 1);

  return (
    <div
      aria-label={`${question.prompt} keyword cloud`}
      className="presenter-word-cloud flex h-full min-h-[clamp(10rem,28vh,20.625rem)] content-center items-center justify-center gap-x-8 gap-y-6 overflow-hidden rounded-[8px] border border-[#7AB8BD] bg-white/30 px-8 py-9 shadow-[inset_0_1px_0_rgba(255,255,255,0.45)]"
      role="img"
    >
      {question.openTextKeywords.map((keyword, index) => (
        <span
          aria-label={`${keyword.label}: ${keyword.count} mentions`}
          className="presenter-word-cloud-token inline-flex rounded-full px-3 py-1 leading-none text-[#006B66] drop-shadow-[0_8px_18px_rgba(0,107,102,0.13)]"
          key={keyword.label}
          style={{
            fontSize: cloudSize(keyword.count, maxCount),
            fontWeight: cloudWeight(keyword.count, maxCount),
            ["--cloud-drift" as string]: `${index % 2 === 0 ? -1 : 1}`,
            ["--cloud-enter-delay" as string]: `${index * 90}ms`,
          }}
        >
          {keyword.label}
        </span>
      ))}
      <AccessibleResults
        data={question.openTextKeywords.map((keyword) => ({
          count: keyword.count,
          label: keyword.label,
          percentage: Math.round((keyword.count / maxCount) * 100),
        }))}
        title={`${question.prompt} keywords`}
      />
    </div>
  );
}

function ChartGroup({ mode, question }: { mode: ChartMode; question: SurveyQuestionResult }) {
  if (question.type === "open_text") {
    return (
      <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(0.75rem,2.6vh,2.5rem)]">
        <h2 className="break-words text-[clamp(1.75rem,min(4.2vw,5.4vh),4.9rem)] font-bold uppercase leading-[1.08] text-[#006B66]">
          {question.prompt}
        </h2>
        <OpenTextWordCloud question={question} />
      </section>
    );
  }

  return (
    <section className="grid h-full min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(0.75rem,3vh,3rem)]">
      <h2 className="break-words text-[clamp(1.75rem,min(4.2vw,5.4vh),4.9rem)] font-bold uppercase leading-[1.08] text-[#006B66]">
        {question.prompt}
      </h2>
      <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-[clamp(0.65rem,1.6vh,1.25rem)]">
        <LowResponseNote count={question.responseCount} />
        {mode === "tiles" ? <TilesResults question={question} /> : <BarResults question={question} />}
      </div>
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
  const [mode, setMode] = useState<ChartMode>("tiles");
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
        <div className="flex min-w-0 items-center gap-3">
          <span aria-hidden="true" className="grid size-4 place-items-center rounded-[3px] border border-[#64748B]" />
          <h1 className="truncate">Present</h1>
          <div aria-live="polite" className="hidden items-center gap-2 rounded-full border border-[#8BC8C5] bg-white/70 px-3 py-1 text-[#006B66] sm:flex">
            <span className="size-2 rounded-full bg-current" aria-hidden="true" />
            <span>{connectionCopy(connectionState)}</span>
          </div>
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
        <section className="grid h-full max-h-[900px] w-full max-w-[1640px] overflow-hidden rounded-[8px] bg-[#DDF4F3]/82 shadow-[0_24px_70px_rgba(15,82,124,0.28)] lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="relative hidden bg-[#A8D4D2]/62 px-8 py-12 text-center lg:grid lg:content-center">
            <div className="grid gap-7">
              <p className="mx-auto max-w-[13rem] text-[22px] font-bold leading-[1.25]">
                Scan the QR or enter the code
              </p>
              <div className="mx-auto grid size-[196px] place-items-center rounded-[8px] bg-white p-4 shadow-[0_16px_32px_rgba(0,107,102,0.12)]">
                <QRCodeCanvas
                  bgColor="#ffffff"
                  fgColor="#020617"
                  level="M"
                  marginSize={2}
                  size={164}
                  title={`QR code for ${eventName} survey join link`}
                  value={joinLink}
                />
              </div>
              <div className="grid gap-4">
                <p aria-label="Join link" className="break-words text-[17px] font-bold leading-[1.25]">
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
          </aside>

          <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_auto] px-6 py-[clamp(1rem,3vh,3rem)] sm:px-10 lg:px-16">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-6">
              <div className="min-w-0 space-y-1.5">
                <p className="sr-only">{eventName} survey presentation</p>
                <p className="text-[clamp(0.7rem,1.4vh,0.875rem)] font-bold uppercase leading-none tracking-[0.18em] text-[#007C78]/80">
                  Survey
                </p>
                <h2 className="break-words text-[clamp(1.2rem,min(2.2vw,2.8vh),2.6rem)] font-bold uppercase leading-[1.12]">
                  {resultState.title}
                </h2>
              </div>
              <p className="hidden whitespace-nowrap text-[24px] font-bold leading-none md:block">
                {responseCopy(resultState.responseCount)} submitted
              </p>
            </div>
            {connectionState !== "live" ? (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[6px] border border-[#007C78] bg-white/58 px-4 py-3 text-[15px] font-semibold leading-[1.35] text-[#006B66]" role="status">
                <p>{connectionDetail(connectionState)}</p>
                {connectionState === "refresh-needed" ? (
                  <button
                    className="min-h-10 rounded-[6px] border border-[#007C78] bg-white px-3 text-sm font-bold outline-none hover:bg-[#E8F8F6] focus-visible:ring-2 focus-visible:ring-[#006B66]"
                    onClick={() => router.refresh()}
                    type="button"
                  >
                    Refresh view
                  </button>
                ) : null}
              </div>
            ) : null}

            <div className="grid min-h-0 content-center overflow-x-hidden overflow-y-auto py-[clamp(0.75rem,2.4vh,2rem)]">
              {activeQuestion ? <ChartGroup mode={mode} question={activeQuestion} /> : <NoResponsesPanel />}
            </div>

            <footer className="grid items-center gap-5 sm:grid-cols-[1fr_auto_1fr]">
              <div className="flex justify-center sm:justify-start">
                {activeQuestion?.type === "open_text" ? (
                  <div className="grid w-[180px] rounded-full bg-white p-1 shadow-[0_12px_26px_rgba(15,82,124,0.10)]">
                    <span className="grid min-h-11 place-items-center rounded-full bg-[#007C78] px-4 text-[18px] font-semibold leading-none text-white">
                      Cloud
                    </span>
                  </div>
                ) : (
                  <div className="grid w-[260px] grid-cols-2 rounded-full bg-white p-1 shadow-[0_12px_26px_rgba(15,82,124,0.10)]">
                    {(["tiles", "bar"] as const).map((option) => (
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
                        {option === "tiles" ? "Tiles" : "Bar"}
                      </button>
                    ))}
                  </div>
                )}
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
