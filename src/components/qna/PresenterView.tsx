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

function statusLabel(status: PublicQuestion["status"]) {
  return status === "answered" ? "Answered" : "Now Showing";
}

function connectionCopy(state: QnaConnectionState) {
  if (state === "live") return "Connected";
  if (state === "reconnecting") return "Reconnecting";
  if (state === "offline") return "Offline";
  return "Refresh needed";
}

function connectionTone(state: QnaConnectionState) {
  if (state === "live") return "text-[#006B66]";
  if (state === "reconnecting" || state === "offline") return "text-amber-800";
  return "text-red-800";
}

function spacedJoinCode(joinCode: string) {
  return joinCode.split("").join(" ");
}

function metadataTime(value: string) {
  return new Date(value).toLocaleTimeString("en-MY", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kuala_Lumpur",
  });
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
              className="min-w-0 break-words text-[20px] font-bold leading-none text-[#006B66] sm:text-[24px]"
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

        {featuredQuestion ? (
          <section
            aria-label="Featured approved question"
            className="relative mx-auto grid h-full min-h-0 w-full max-w-[1500px] grid-cols-1 content-center items-center gap-[clamp(1.5rem,4vh,2.5rem)] overflow-y-auto px-5 py-[clamp(1rem,3vh,2rem)] sm:px-10 lg:grid-cols-[minmax(0,1.62fr)_minmax(300px,0.82fr)] lg:gap-[clamp(2rem,5vw,6rem)] lg:px-16 lg:py-0"
          >
            <article
              className="presenter-question-swap grid min-w-0 gap-[clamp(1.5rem,4vh,3.5rem)]"
              data-testid="presenter-featured-question"
              key={featuredQuestion.id}
            >
              <div className="grid max-w-[920px] gap-[clamp(0.75rem,2.4vh,1.75rem)]">
                <p className="text-[14px] font-black uppercase leading-none tracking-[0.34em] text-[#006B66]">
                  Current question
                </p>
                <p className="break-words text-[clamp(2.25rem,min(5.5vw,8.5vh),6.7rem)] font-bold leading-[1.04] tracking-normal text-[#1F2933]">
                  {featuredQuestion.current_text}
                </p>
              </div>

              <div className="flex min-w-0 flex-wrap items-center gap-5">
                <span className="rounded-full border border-[#B8D8D3] bg-white/75 px-5 py-3 text-[15px] font-black leading-none text-[#006B66] shadow-[0_16px_36px_rgba(0,107,102,0.08)]">
                  Q&amp;A Status
                </span>
                <div className="min-w-0">
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-[clamp(1rem,min(1.4vw,2vh),1.25rem)] font-semibold leading-[1.35] text-[#667085]">
                    <span>{statusLabel(featuredQuestion.status)}</span>
                    <span aria-hidden="true">·</span>
                    <span>Queue #{featuredQuestionQueueNumber}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {featuredQuestion.vote_count} {featuredQuestion.vote_count === 1 ? "vote" : "votes"}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Asked at {metadataTime(featuredQuestion.submitted_at)}</span>
                  </p>
                  {featuredQuestion.is_edited ? (
                    <p className="mt-1 text-sm font-semibold leading-[1.3] text-[#667085]">Edited</p>
                  ) : null}
                </div>
              </div>
            </article>

            <aside className="relative mx-auto grid w-full max-w-[430px] gap-[clamp(1rem,2.6vh,2rem)] overflow-hidden rounded-[8px] border border-[#DCE7E3] bg-white/82 px-8 py-[clamp(1.25rem,3vh,2.25rem)] text-center shadow-[0_28px_70px_rgba(31,41,51,0.12)] sm:px-10">
              <div
                className="pointer-events-none absolute -right-16 -top-20 size-72 rounded-full bg-[radial-gradient(circle,rgba(0,107,102,0.20),rgba(0,107,102,0)_68%)]"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute bottom-10 left-8 size-40 rounded-full bg-[radial-gradient(circle,rgba(0,107,102,0.10),rgba(0,107,102,0)_70%)]"
                aria-hidden="true"
              />
              <div className="relative mx-auto grid size-[clamp(11rem,26vh,20.5rem)] place-items-center rounded-[8px] bg-[#006B66] p-[clamp(0.75rem,1.6vh,1.5rem)] shadow-[0_22px_54px_rgba(0,107,102,0.22)]">
                <div className="grid size-full place-items-center rounded-[6px] border-[clamp(6px,1.2vh,10px)] border-white bg-[#F8F7F2]">
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
              <div className="relative grid gap-[clamp(0.5rem,1.6vh,1rem)]">
                <h2 className="mx-auto max-w-[14ch] text-[clamp(1.375rem,min(2.4vw,3.2vh),1.875rem)] font-black leading-[1.08] text-[#006B66]">
                  Scan to ask a question
                </h2>
                <p className="text-[clamp(0.95rem,1.8vh,1.0625rem)] font-semibold leading-[1.35] text-[#667085]">or enter join code</p>
                <p
                  aria-label="Join code"
                  className="w-full max-w-full whitespace-nowrap rounded-full border border-[#D9D5C9] bg-[#F8F7F2] px-5 py-4 font-mono text-[clamp(1.2rem,2.2vw,1.6rem)] font-black leading-none tracking-[0.14em] text-[#1F2933] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]"
                >
                  {spacedJoinCode(joinCode)}
                </p>
              </div>
            </aside>
          </section>
        ) : (
          <section className="mx-auto grid h-full min-h-0 w-full max-w-[1280px] place-items-center px-4 py-10 text-center sm:px-8 lg:px-16">
            <div className="grid max-w-3xl gap-6">
              <p className="text-[14px] font-black uppercase leading-none tracking-[0.34em] text-[#006B66]">
                Active question
              </p>
              <h2 className="break-words text-[clamp(2rem,min(5vw,7vh),3.5rem)] font-black leading-[1.12] text-[#1F2933]">
                No approved questions yet
              </h2>
              <p className="text-lg font-semibold leading-[1.5] text-[#667085]">
                Questions will appear here after moderation.
              </p>
            </div>
          </section>
        )}

        <footer className="flex items-center border-t border-[#D9D5C9] px-4 py-3 text-[12px] font-bold leading-none sm:px-16">
          <div className="flex min-w-0 items-center gap-3">
            <div aria-live="polite" className={`flex min-w-0 items-center gap-2 ${connectionTone(connectionState)}`}>
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              <span>Connection: {connectionCopy(connectionState)}</span>
            </div>
            {connectionState === "refresh-needed" ? (
              <>
                <span className="hidden text-[#D9D5C9] sm:inline" aria-hidden="true">
                  /
                </span>
                <p className="text-red-800">Live updates are not reconnecting. Refresh this view to continue.</p>
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
        </footer>
      </div>
    </main>
  );
}
