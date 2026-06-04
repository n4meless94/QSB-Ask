"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

import type { PublicQuestion } from "@/lib/qna/public";
import { subscribeToPublicQuestions, type QnaConnectionState } from "@/lib/qna/realtime";

type PresenterViewProps = {
  eventId: string;
  eventName: string;
  fixtureMode?: boolean;
  joinCode: string;
  joinLink: string;
  questions: PublicQuestion[];
};

type PresenterSort = "popular" | "recent";

/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
/* Hallmark · macrostructure: Executive Briefing Display · tone: austere corporate townhall · anchor hue: qsb-teal */

function sortQuestions(questions: PublicQuestion[], sort: PresenterSort) {
  return [...questions].sort((left, right) => {
    if (sort === "recent") {
      return new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime();
    }

    return (
      right.vote_count - left.vote_count ||
      new Date(right.submitted_at).getTime() - new Date(left.submitted_at).getTime()
    );
  });
}

function statusLabel(status: PublicQuestion["status"]) {
  return status === "answered" ? "Answered" : "Live";
}

function connectionCopy(state: QnaConnectionState) {
  if (state === "live") return "Connected";
  if (state === "reconnecting") return "Reconnecting";
  if (state === "offline") return "Offline";
  return "Refresh needed";
}

function connectionClasses(state: QnaConnectionState) {
  if (state === "live") {
    return "border-teal-700 bg-teal-50 text-teal-900";
  }

  if (state === "reconnecting" || state === "offline") {
    return "border-amber-700 bg-amber-50 text-amber-900";
  }

  return "border-red-700 bg-red-50 text-red-900";
}

function spacedJoinCode(joinCode: string) {
  return joinCode.split("").join(" ");
}

function eventKicker(eventName: string) {
  return eventName.toUpperCase();
}

export function PresenterView({
  eventId,
  eventName,
  fixtureMode = false,
  joinCode,
  joinLink,
  questions,
}: PresenterViewProps) {
  const router = useRouter();
  const [questionState, setQuestionState] = useState(questions);
  const [connectionState, setConnectionState] = useState<QnaConnectionState>("live");
  const sortedQuestions = useMemo(() => sortQuestions(questionState, "popular"), [questionState]);
  const featuredQuestion = sortedQuestions[0];

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

  return (
    <main className="fixed inset-0 z-50 overflow-y-auto bg-[#fbfaf6] text-[#24231f]">
      <div className="grid min-h-screen grid-rows-[72px_minmax(0,1fr)_50px]">
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-[#c9c5ba] px-4 sm:px-8 lg:px-16">
          <div className="flex min-w-0 items-center gap-4 sm:gap-6">
            <h1
              aria-label={`${eventName} Presenter View`}
              className="min-w-0 break-words text-[22px] font-bold leading-none text-[#00564f] sm:text-[26px]"
            >
              Townhall Briefing
            </h1>
            <span className="hidden h-7 w-px bg-[#c9c5ba] sm:block" aria-hidden="true" />
            <p className="hidden min-w-0 text-[13px] font-semibold uppercase leading-none tracking-[0.24em] text-[#5f625f] sm:block">
              {eventKicker(eventName)}
            </p>
          </div>
          <div className="flex items-center gap-3 text-[#00564f] sm:gap-6">
            <div className="hidden items-center gap-2 text-[13px] font-semibold leading-none tracking-[0.08em] sm:flex">
              <span className="font-mono text-base leading-none" aria-hidden="true">
                ((•))
              </span>
              <span>QSB Ask · Live Q&amp;A</span>
            </div>
            <button
              aria-label="Presenter settings"
              className="grid size-9 place-items-center rounded-[4px] text-[#4c5b65] outline-none hover:bg-[#eeeae1] focus-visible:ring-2 focus-visible:ring-[#00564f] focus-visible:ring-offset-2"
              type="button"
            >
              <span className="text-[23px] leading-none" aria-hidden="true">
                ⚙
              </span>
            </button>
            <button
              aria-label="Fullscreen"
              className="grid size-9 place-items-center rounded-[4px] text-[#4c5b65] outline-none hover:bg-[#eeeae1] focus-visible:ring-2 focus-visible:ring-[#00564f] focus-visible:ring-offset-2"
              type="button"
            >
              <span className="text-[24px] leading-none" aria-hidden="true">
                ⛶
              </span>
            </button>
          </div>
        </header>

        {featuredQuestion ? (
          <section
            aria-label="Featured approved question"
            className="mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-10 px-4 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_363px] lg:px-16 lg:py-0"
          >
            <article className="grid gap-12 lg:gap-14">
              <div className="grid max-w-[760px] gap-6">
                <p className="text-[13px] font-bold uppercase leading-none tracking-[0.36em] text-[#00615a]">
                  Active question
                </p>
                <p className="break-words text-[42px] font-bold leading-[1.18] tracking-normal text-[#252420] sm:text-[56px] lg:text-[51px]">
                  {featuredQuestion.current_text}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="relative grid size-16 shrink-0 place-items-end overflow-hidden rounded-[8px] border border-[#00564f] bg-[#062d2d] shadow-[0_10px_24px_rgba(0,86,79,0.18)]">
                  <div className="absolute inset-x-4 top-3 h-5 rounded-full bg-[#efe8dc]" aria-hidden="true" />
                  <div className="absolute left-1/2 top-6 h-8 w-5 -translate-x-1/2 rounded-full bg-[#c9b59b]" aria-hidden="true" />
                  <div className="relative h-8 w-12 rounded-t-[20px] bg-[#10181c]" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="break-words text-[23px] font-bold leading-[1.1] text-[#252420]">
                    Jameson Sterling
                  </p>
                  <p className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-base font-medium leading-[1.3] text-[#5f625f]">
                    <span>Global CEO</span>
                    <span aria-hidden="true">·</span>
                    <span>{statusLabel(featuredQuestion.status)}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {featuredQuestion.vote_count} {featuredQuestion.vote_count === 1 ? "vote" : "votes"}
                    </span>
                  </p>
                  {featuredQuestion.is_edited ? (
                    <p className="mt-1 text-sm font-semibold leading-[1.3] text-[#5f625f]">Edited</p>
                  ) : null}
                </div>
              </div>
            </article>

            <aside className="mx-auto grid w-full max-w-[363px] gap-7 rounded-[3px] border border-[#c5cbd0] bg-[#eef2f6] px-6 py-10 text-center shadow-[0_1px_0_rgba(0,0,0,0.04)] sm:px-10">
              <div className="mx-auto grid size-[250px] place-items-center rounded-[3px] bg-[#005b57] p-5 sm:size-[270px] sm:p-6">
                <div className="grid size-[205px] place-items-center rounded-[2px] border-[6px] border-white bg-[#fbfaf6] sm:size-[220px]">
                  <QRCodeCanvas
                    bgColor="#fbfaf6"
                    fgColor="#020617"
                    level="M"
                    marginSize={2}
                    size={172}
                    title={`QR code for ${eventName} Q&A join link`}
                    value={joinLink}
                  />
                </div>
              </div>
              <div className="grid gap-4">
                <h2 className="mx-auto max-w-[12ch] text-[26px] font-bold leading-[1.12] text-[#00564f]">
                  Scan to ask a question
                </h2>
                <p className="text-base font-medium leading-[1.35] text-[#6f7376]">Enter join code</p>
                <p
                  aria-label="Join code"
                  className="max-w-full whitespace-nowrap rounded-[10px] border border-[#c6c2b8] bg-[#e6e1d8] px-3 py-4 font-mono text-[clamp(1.2rem,5.7vw,1.65rem)] font-bold leading-none tracking-[0.06em] text-[#24231f]"
                >
                  {spacedJoinCode(joinCode)}
                </p>
              </div>
            </aside>
          </section>
        ) : (
          <section className="mx-auto grid w-full max-w-[1280px] place-items-center px-4 py-10 text-center sm:px-8 lg:px-16">
            <div className="grid max-w-3xl gap-6">
              <p className="text-[13px] font-bold uppercase leading-none tracking-[0.36em] text-[#00615a]">
                Active question
              </p>
              <h2 className="break-words text-[42px] font-bold leading-[1.12] text-[#252420] sm:text-[56px]">
                No approved questions yet
              </h2>
              <p className="text-lg font-semibold leading-[1.5] text-[#5f625f]">
                Questions will appear here after moderation.
              </p>
            </div>
          </section>
        )}

        <footer className="grid grid-cols-1 items-center gap-3 border-t border-[#c9c5ba] px-4 py-3 text-[13px] font-semibold leading-none text-[#b7c0c7] sm:grid-cols-[1fr_auto_1fr] sm:px-16">
          <div className="flex min-w-0 items-center gap-5">
            <span className="hidden h-7 w-px bg-[#c9c5ba] sm:block" aria-hidden="true" />
            <div
              aria-live="polite"
              className={`flex min-w-0 items-center gap-2 rounded-[4px] border border-transparent bg-transparent p-0 ${connectionClasses(
                connectionState,
              )}`}
            >
              <span className="size-2 rounded-full bg-current" aria-hidden="true" />
              <span>Connection: {connectionCopy(connectionState)}</span>
            </div>
            {connectionState === "refresh-needed" ? (
              <button
                className="rounded-[4px] border border-current bg-white px-2 py-1 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                onClick={() => router.refresh()}
                type="button"
              >
                Refresh view
              </button>
            ) : null}
          </div>
          <nav aria-label="Presenter support links" className="flex justify-center gap-8 text-center underline underline-offset-4">
            <a href="/admin/health">Support</a>
            <a href="/admin/setup">Privacy Policy</a>
            <a href="/dashboard">Presenter Guide</a>
          </nav>
          <p className="text-left sm:text-right">© 2026 QSB Ask. All Rights Reserved.</p>
        </footer>
      </div>
    </main>
  );
}
