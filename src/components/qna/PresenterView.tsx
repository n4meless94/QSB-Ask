"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, Radio } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";

import type { PublicQuestion } from "@/lib/qna/public";
import { comparePresenterQueueQuestions } from "@/lib/qna/presenter-queue";
import { subscribeToPresenterFocus } from "@/lib/qna/presenter-control";
import { subscribeToPublicQuestions, type QnaConnectionState } from "@/lib/qna/realtime";

type PresenterViewProps = {
  eventId: string;
  eventName: string;
  fixtureMode?: boolean;
  joinCode: string;
  joinLink: string;
  questions: PublicQuestion[];
  selectedQuestionId?: string;
};

/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · macrostructure: Executive Briefing Display · tone: austere corporate townhall · anchor hue: qsb-teal */

function sortQuestions(questions: PublicQuestion[]) {
  return [...questions].sort(comparePresenterQueueQuestions);
}

function heroLabel(status: PublicQuestion["status"]) {
  return status === "answered" ? "Just answered" : "Now answering";
}

function heroStatusText(status: PublicQuestion["status"]) {
  return status === "answered" ? "Answered" : "Live now";
}

/** Audience-facing wording — never expose raw connection terminology on the big screen. */
function statusCopy(state: QnaConnectionState) {
  if (state === "live") return "Live Q&A active";
  if (state === "reconnecting") return "Reconnecting…";
  if (state === "offline") return "Connection lost";
  return "Refresh needed";
}

function statusTone(state: QnaConnectionState) {
  if (state === "live") return "text-[#006B66]";
  if (state === "reconnecting" || state === "offline") return "text-amber-800";
  return "text-red-800";
}

/**
 * Moderator-facing queue hint: how many approved-but-unanswered (live) questions are still
 * queued up behind the one on screen. Mirrors the dashboard "Live" pool, and intentionally
 * avoids the word "waiting" so it does not clash with the dashboard's pending-approval metric.
 */
function queueCopy(remaining: number) {
  if (remaining <= 0) return "Queue clear";
  if (remaining === 1) return "Next question ready";
  return `${remaining} questions in queue`;
}

/** Group the join code into readable blocks of four, e.g. "8HP3WQ6C" -> "8HP3-WQ6C". */
function groupedJoinCode(joinCode: string) {
  const clean = joinCode.trim().toUpperCase();

  if (clean.length <= 4) return clean;

  return clean.replace(/(.{4})(?=.)/g, "$1-");
}

/** Spell the code out for screen readers so it is read character by character. */
function spokenJoinCode(joinCode: string) {
  return joinCode.trim().toUpperCase().split("").join(" ");
}

export function PresenterView({
  eventId,
  eventName,
  fixtureMode = false,
  joinCode,
  joinLink,
  questions,
  selectedQuestionId,
}: PresenterViewProps) {
  const router = useRouter();
  const [questionState, setQuestionState] = useState(questions);
  const [activeQuestionId, setActiveQuestionId] = useState(selectedQuestionId);
  const [connectionState, setConnectionState] = useState<QnaConnectionState>("live");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const sourceQuestions = fixtureMode ? questionState : questions;
  const sortedQuestions = useMemo(() => sortQuestions(sourceQuestions), [sourceQuestions]);
  const focusedQuestion = activeQuestionId
    ? sortedQuestions.find((question) => question.id === activeQuestionId)
    : undefined;
  const featuredQuestion = focusedQuestion ?? sortedQuestions[0];
  const featuredQuestionQueueNumber = featuredQuestion
    ? sortedQuestions.findIndex((question) => question.id === featuredQuestion.id) + 1
    : 0;
  const liveQuestionsRemaining = sortedQuestions.filter(
    (question) => question.status !== "answered" && question.id !== featuredQuestion?.id,
  ).length;

  useEffect(() => {
    return subscribeToPresenterFocus(eventId, setActiveQuestionId);
  }, [eventId]);

  useEffect(() => {
    function syncFullscreenState() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }

    document.addEventListener("fullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    if (fixtureMode) {
      function refreshFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ questions?: PublicQuestion[] }>).detail;

        if (detail?.questions) {
          setQuestionState(detail.questions);
          setConnectionState("live");
        }
      }

      function connectionFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ state?: QnaConnectionState }>).detail;

        if (detail?.state) {
          setConnectionState(detail.state);
        }
      }

      window.addEventListener("qsb-ask:e2e-qna-refresh", refreshFromFixture);
      window.addEventListener("qsb-ask:e2e-qna-connection", connectionFromFixture);
      document.body.dataset.qnaRealtimeReady = "true";
      return () => {
        window.removeEventListener("qsb-ask:e2e-qna-refresh", refreshFromFixture);
        window.removeEventListener("qsb-ask:e2e-qna-connection", connectionFromFixture);
        delete document.body.dataset.qnaRealtimeReady;
      };
    }

    return subscribeToPublicQuestions({
      eventId,
      onConnectionChange: setConnectionState,
      onRefresh: () => router.refresh(),
      refreshIntervalMs: 2000,
    });
  }, [eventId, fixtureMode, router]);

  async function toggleFullscreen() {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen?.();
      return;
    }

    await document.exitFullscreen?.();
  }

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-[#F8F7F2] text-[#1F2933]">
      <div className="grid h-full min-h-0 grid-rows-[clamp(56px,9vh,74px)_minmax(0,1fr)_clamp(36px,6vh,42px)]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-[#D9D5C9] bg-[rgba(248,247,242,0.9)] px-4 sm:px-8 lg:px-16">
          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <h1
              aria-label={`${eventName} Presenter View`}
              className="min-w-0 break-words text-[clamp(16px,2.2vw,24px)] font-bold leading-tight text-[#006B66]"
            >
              {eventName}
            </h1>
          </div>
          <div className="flex items-center gap-3 text-[#006B66] sm:gap-5">
            <div className="hidden items-center gap-2 rounded-full border border-[#B8D8D3] bg-white/70 px-4 py-2 text-[13px] font-bold leading-none shadow-[0_10px_30px_rgba(0,107,102,0.08)] sm:flex">
              <Radio aria-hidden="true" size={18} strokeWidth={2.5} />
              <span>QSB Ask · Live Q&amp;A</span>
            </div>
            <button
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-pressed={isFullscreen}
              className="grid size-10 place-items-center rounded-[8px] text-[#667085] outline-none hover:bg-[#EEEAE1] focus-visible:ring-2 focus-visible:ring-[#006B66] focus-visible:ring-offset-2"
              onClick={toggleFullscreen}
              type="button"
            >
              {isFullscreen ? <Minimize2 aria-hidden="true" size={20} /> : <Maximize2 aria-hidden="true" size={20} />}
            </button>
          </div>
        </header>

        <section
          aria-label="Live question display"
          className="mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-cols-1 content-center items-center gap-[clamp(1.5rem,4vh,2.5rem)] overflow-y-auto px-5 py-[clamp(1rem,3vh,2rem)] sm:px-10 lg:grid-cols-[minmax(0,1.7fr)_minmax(280px,0.74fr)] lg:gap-[clamp(2rem,4.5vw,5rem)] lg:px-16 lg:py-0"
        >
          {featuredQuestion ? (
            <article
              className="presenter-question-swap relative min-w-0 overflow-hidden rounded-[14px] border border-[#E5E1D4] bg-white/55 py-[clamp(1.25rem,3.6vh,2.75rem)] pl-[clamp(1.25rem,2.6vw,3rem)] pr-[clamp(1rem,2.4vw,2.5rem)] shadow-[0_24px_64px_rgba(31,41,51,0.07)]"
              data-testid="presenter-featured-question"
              key={featuredQuestion.id}
            >
              <span
                aria-hidden="true"
                className="absolute inset-y-0 left-0 w-[clamp(5px,0.55vw,8px)] bg-[#006B66]"
              />
              <div className="grid min-w-0 gap-[clamp(1rem,3.2vh,2.25rem)]">
                <p className="flex items-center gap-3 text-[clamp(0.75rem,1.4vh,0.95rem)] font-black uppercase leading-none tracking-[0.32em] text-[#006B66]">
                  {featuredQuestion.status !== "answered" ? (
                    <span className="relative flex size-2.5" aria-hidden="true">
                      <span className="absolute inline-flex size-full rounded-full bg-[#006B66] opacity-60 motion-safe:animate-ping" />
                      <span className="relative inline-flex size-2.5 rounded-full bg-[#006B66]" />
                    </span>
                  ) : null}
                  {heroLabel(featuredQuestion.status)}
                </p>

                <p className="break-words text-[clamp(2.25rem,min(5.5vw,8.5vh),6.7rem)] font-bold leading-[1.04] tracking-normal text-[#1F2933]">
                  {featuredQuestion.current_text}
                </p>

                <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 text-[clamp(1rem,min(1.5vw,2.1vh),1.375rem)] font-semibold leading-[1.3] text-[#667085]">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#B8D8D3] bg-[rgba(0,107,102,0.06)] px-4 py-2 leading-none text-[#006B66]">
                    {heroStatusText(featuredQuestion.status)}
                  </span>
                  <span className="inline-flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span aria-hidden="true">·</span>
                    <span>
                      {featuredQuestion.vote_count} {featuredQuestion.vote_count === 1 ? "vote" : "votes"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Queue #{featuredQuestionQueueNumber}</span>
                    {featuredQuestion.is_edited ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>Edited</span>
                      </>
                    ) : null}
                  </span>
                </div>
              </div>
            </article>
          ) : (
            <div className="grid min-w-0 gap-[clamp(0.75rem,2.4vh,1.5rem)] rounded-[14px] border border-[#E5E1D4] bg-white/55 py-[clamp(1.5rem,4vh,3rem)] pl-[clamp(1.25rem,2.6vw,3rem)] pr-[clamp(1rem,2.4vw,2.5rem)] shadow-[0_24px_64px_rgba(31,41,51,0.07)]">
              <p className="text-[clamp(0.75rem,1.4vh,0.95rem)] font-black uppercase leading-none tracking-[0.32em] text-[#006B66]">
                Q&amp;A is open
              </p>
              <p className="break-words text-[clamp(1.75rem,min(4.2vw,6vh),3.75rem)] font-bold leading-[1.1] text-[#1F2933]">
                Waiting for the first question
              </p>
              <p className="text-[clamp(1rem,1.8vh,1.25rem)] font-semibold leading-[1.45] text-[#667085]">
                Scan the code to send yours — approved questions appear here.
              </p>
            </div>
          )}

          <aside className="relative mx-auto grid w-full max-w-[360px] gap-[clamp(0.75rem,2.2vh,1.5rem)] rounded-[12px] border border-[#DCE7E3] bg-white/85 px-7 py-[clamp(1.25rem,3vh,2rem)] text-center shadow-[0_20px_50px_rgba(31,41,51,0.10)] sm:px-8">
            <div className="grid gap-1">
              <h2 className="text-[clamp(1.25rem,min(2vw,2.8vh),1.625rem)] font-black leading-[1.1] text-[#006B66]">
                Ask a question
              </h2>
              <p className="text-[clamp(0.875rem,1.6vh,1rem)] font-semibold leading-[1.35] text-[#667085]">
                Scan the QR code or enter this code
              </p>
            </div>

            <div className="relative mx-auto grid size-[clamp(9rem,20vh,15rem)] place-items-center rounded-[10px] bg-[#006B66] p-[clamp(0.625rem,1.4vh,1.125rem)] shadow-[0_16px_40px_rgba(0,107,102,0.20)]">
              <div className="grid size-full place-items-center rounded-[6px] border-[clamp(5px,1vh,8px)] border-white bg-[#F8F7F2]">
                <QRCodeCanvas
                  bgColor="#F8F7F2"
                  className="h-auto w-full max-w-full"
                  fgColor="#020617"
                  level="M"
                  marginSize={2}
                  size={224}
                  style={{ height: "auto", width: "100%" }}
                  title={`QR code for ${eventName} Q&A join link`}
                  value={joinLink}
                />
              </div>
            </div>

            <p
              aria-label={`Join code ${spokenJoinCode(joinCode)}`}
              className="w-full max-w-full whitespace-nowrap rounded-[8px] border border-[#D9D5C9] bg-[#F8F7F2] px-4 py-3 font-mono text-[clamp(1.125rem,2vw,1.5rem)] font-black leading-none tracking-[0.18em] text-[#1F2933] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
            >
              <span aria-hidden="true">{groupedJoinCode(joinCode)}</span>
            </p>
          </aside>
        </section>

        <footer className="flex items-center justify-between gap-3 border-t border-[#D9D5C9] px-4 py-3 text-[12px] font-bold leading-none sm:px-16">
          <div className="flex min-w-0 items-center gap-3">
            <div aria-live="polite" className={`flex min-w-0 items-center gap-2 ${statusTone(connectionState)}`}>
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              <span>{statusCopy(connectionState)}</span>
            </div>
            {connectionState === "refresh-needed" ? (
              <>
                <span className="hidden text-[#D9D5C9] sm:inline" aria-hidden="true">
                  /
                </span>
                <p className="text-red-800">Live updates stopped. Refresh this view to continue.</p>
                <button
                  className="rounded-[6px] border border-red-800 bg-white px-2 py-1 text-red-800 outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2"
                  onClick={() => router.refresh()}
                  type="button"
                >
                  Refresh view
                </button>
              </>
            ) : null}
          </div>
          <p className="shrink-0 text-[#8A93A0]" data-testid="presenter-queue-indicator">
            {queueCopy(liveQuestionsRemaining)}
          </p>
        </footer>
      </div>
    </main>
  );
}
