"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { ConnectionStatus } from "@/components/qna/ConnectionStatus";
import type { PublicQuestion } from "@/lib/qna/public";
import { subscribeToPublicQuestions, type QnaConnectionState } from "@/lib/qna/realtime";

type PresenterViewProps = {
  eventId: string;
  eventName: string;
  fixtureMode?: boolean;
  questions: PublicQuestion[];
};

type PresenterSort = "popular" | "recent";

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

export function PresenterView({ eventId, eventName, fixtureMode = false, questions }: PresenterViewProps) {
  const router = useRouter();
  const [sort, setSort] = useState<PresenterSort>("popular");
  const [questionState, setQuestionState] = useState(questions);
  const [connectionState, setConnectionState] = useState<QnaConnectionState>("live");
  const sortedQuestions = useMemo(() => sortQuestions(questionState, sort), [questionState, sort]);

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
    <div className="grid gap-6">
      <header className="grid gap-3 border-b border-slate-300 pb-5">
        <ConnectionStatus onRefresh={() => router.refresh()} state={connectionState} />
        <h1 className="text-[32px] font-semibold leading-[1.15] text-slate-950 sm:text-[44px]">
          {eventName} Presenter View
        </h1>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[20px] font-semibold leading-[1.25] text-slate-900">
          Approved questions
        </h2>
        <div aria-label="Sort presenter questions" className="flex min-w-0 flex-wrap gap-2" role="radiogroup">
          {(["popular", "recent"] as const).map((option) => (
            <button
              aria-checked={sort === option}
              className={[
                "inline-flex min-h-10 items-center rounded-[6px] border px-3 text-sm font-semibold leading-[1.4]",
                sort === option
                  ? "border-teal-700 bg-white text-teal-700"
                  : "border-slate-300 bg-white text-slate-700",
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
      </div>

      {sortedQuestions.length === 0 ? (
        <div className="rounded-[6px] border border-slate-300 bg-white p-6">
          <p className="text-[24px] font-semibold leading-[1.25] text-slate-800">
            No approved questions yet.
          </p>
        </div>
      ) : (
        <ol className="grid gap-4">
          {sortedQuestions.map((question) => (
            <li className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-5 sm:p-6" key={question.id}>
              <p className="break-words text-[24px] font-semibold leading-[1.25] text-slate-950 sm:text-[34px]">
                {question.current_text}
              </p>
              <div className="flex flex-wrap gap-2 text-base leading-6 text-slate-700">
                <span className="rounded-[6px] border border-slate-300 px-2 py-1 font-semibold">
                  {statusLabel(question.status)}
                </span>
                <span className="rounded-[6px] border border-slate-300 px-2 py-1 font-semibold">
                  {question.vote_count} {question.vote_count === 1 ? "vote" : "votes"}
                </span>
                {question.is_edited ? (
                  <span className="rounded-[6px] border border-slate-300 px-2 py-1 font-semibold">
                    Edited
                  </span>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
