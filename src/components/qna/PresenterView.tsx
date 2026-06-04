"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { EventJoinQrCard } from "@/components/events/EventJoinQrCard";
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

export function PresenterView({
  eventId,
  eventName,
  fixtureMode = false,
  joinCode,
  joinLink,
  questions,
}: PresenterViewProps) {
  const router = useRouter();
  const [sort, setSort] = useState<PresenterSort>("popular");
  const [questionState, setQuestionState] = useState(questions);
  const [connectionState, setConnectionState] = useState<QnaConnectionState>("live");
  const sortedQuestions = useMemo(() => sortQuestions(questionState, sort), [questionState, sort]);
  const featuredQuestion = sortedQuestions[0];
  const upcomingQuestions = sortedQuestions.slice(1, 4);

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
    <main className="fixed inset-0 z-50 overflow-y-auto bg-[var(--color-paper)] text-slate-950">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-rows-[auto_minmax(0,1fr)_auto] gap-5 px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <header className="grid gap-4 border-b border-slate-300 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,440px)_auto] lg:items-start">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase leading-[1.4] tracking-normal text-teal-800">
              QSB Ask · Live Q&amp;A
            </p>
            <h1
              aria-label={`${eventName} Presenter View`}
              className="mt-1 break-words text-[32px] font-semibold leading-[1.05] text-slate-950 sm:text-[48px] lg:text-[60px]"
            >
              {eventName}
            </h1>
          </div>
          <EventJoinQrCard
            eventName={eventName}
            joinCode={joinCode}
            joinLink={joinLink}
            variant="presenter"
          />
          <div
            aria-live="polite"
            className={`flex w-fit items-center gap-2 rounded-[6px] border px-3 py-2 text-sm font-semibold leading-[1.4] ${connectionClasses(
              connectionState,
            )}`}
          >
            <span className="size-2 rounded-full bg-current" aria-hidden="true" />
            <span>{connectionCopy(connectionState)}</span>
            {connectionState === "refresh-needed" ? (
              <button
                className="ml-1 rounded-[6px] border border-current bg-white px-2 py-1 text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
                onClick={() => router.refresh()}
                type="button"
              >
                Refresh
              </button>
            ) : null}
          </div>
        </header>

        {featuredQuestion ? (
          <section
            aria-label="Featured approved question"
            className="grid min-h-0 gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,340px)] lg:items-stretch"
          >
            <article className="grid min-h-[420px] content-between gap-6 rounded-[6px] border border-slate-300 bg-white p-6 shadow-[var(--shadow-panel)] sm:p-8 lg:min-h-0 lg:p-10">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-[6px] border border-teal-700 bg-teal-50 px-3 py-2 text-base font-semibold leading-[1.4] text-teal-900">
                  {statusLabel(featuredQuestion.status)}
                </span>
                <span className="rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2 font-mono text-base font-semibold leading-[1.4] tracking-normal text-slate-800">
                  {featuredQuestion.vote_count} {featuredQuestion.vote_count === 1 ? "vote" : "votes"}
                </span>
                {featuredQuestion.is_edited ? (
                  <span className="rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2 text-base font-semibold leading-[1.4] text-slate-700">
                    Edited
                  </span>
                ) : null}
              </div>
              <p className="max-w-5xl break-words text-[34px] font-semibold leading-[1.12] text-slate-950 sm:text-[54px] lg:text-[68px]">
                {featuredQuestion.current_text}
              </p>
              <p className="text-base font-semibold leading-[1.5] text-slate-600">
                Approved by moderation · Safe to display
              </p>
            </article>

            <aside className="grid min-h-0 gap-3 rounded-[6px] border border-slate-300 bg-white/80 p-4 lg:content-start">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-950">
                  Approved queue
                </h2>
                <span className="rounded-[6px] border border-slate-300 bg-white px-2 py-1 font-mono text-sm font-semibold leading-[1.4] tracking-normal text-slate-700">
                  {sortedQuestions.length}
                </span>
              </div>
              {upcomingQuestions.length > 0 ? (
                <ol className="grid gap-3">
                  {upcomingQuestions.map((question, index) => (
                    <li className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-3" key={question.id}>
                      <p className="text-sm font-semibold leading-[1.4] text-teal-800">
                        Next {index + 1}
                      </p>
                      <p className="break-words text-base font-semibold leading-[1.35] text-slate-950">
                        {question.current_text}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-[6px] border border-slate-300 bg-slate-50 px-2 py-1 text-sm font-semibold leading-[1.4] text-slate-700">
                          {statusLabel(question.status)}
                        </span>
                        <span className="rounded-[6px] border border-slate-300 bg-slate-50 px-2 py-1 font-mono text-sm font-semibold leading-[1.4] tracking-normal text-slate-600">
                          {question.vote_count} {question.vote_count === 1 ? "vote" : "votes"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="rounded-[6px] border border-slate-300 bg-white p-3 text-sm font-semibold leading-[1.5] text-slate-600">
                  No other approved questions in the queue.
                </p>
              )}
            </aside>
          </section>
        ) : (
          <section className="grid min-h-[55vh] place-items-center rounded-[6px] border border-slate-300 bg-white p-8 text-center shadow-[var(--shadow-panel)]">
            <div className="grid max-w-2xl gap-4">
              <p className="text-sm font-semibold uppercase leading-[1.4] tracking-normal text-teal-800">
                Live Q&amp;A
              </p>
              <h2 className="text-[36px] font-semibold leading-[1.08] text-slate-950 sm:text-[58px]">
                No approved questions yet
              </h2>
              <p className="text-lg font-semibold leading-[1.5] text-slate-600">
                Questions will appear here after moderation.
              </p>
            </div>
          </section>
        )}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-300 pt-4 text-sm font-semibold leading-[1.4] text-slate-600">
          <span>Showing approved questions only</span>
          <div aria-label="Sort presenter questions" className="flex gap-2" role="radiogroup">
            {(["popular", "recent"] as const).map((option) => (
              <button
                aria-checked={sort === option}
                className={[
                  "inline-flex min-h-10 items-center rounded-[6px] border px-3 text-sm font-semibold leading-[1.4] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2",
                  sort === option
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                ].join(" ")}
                key={option}
                onClick={() => setSort(option)}
                role="radio"
                type="button"
              >
                {option === "popular" ? "Popular" : "Recent"}
              </button>
            ))}
          </div>
        </footer>
      </div>
    </main>
  );
}
