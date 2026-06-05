"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";

import { voteQuestionAction } from "@/app/join/[joinCode]/qna/vote-actions";
import { ConnectionStatus } from "@/components/qna/ConnectionStatus";
import type { PublicQuestion } from "@/lib/qna/public";
import { subscribeToPublicQuestions, type QnaConnectionState } from "@/lib/qna/realtime";

type AudienceQuestionListProps = {
  eventId: string;
  fixtureMode?: boolean;
  initialVotedQuestionIds: string[];
  joinCode: string;
  questions: PublicQuestion[];
};

type AudienceSort = "popular" | "recent";

function sortQuestions(questions: PublicQuestion[], sort: AudienceSort) {
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

export function AudienceQuestionList({
  eventId,
  fixtureMode = false,
  initialVotedQuestionIds,
  joinCode,
  questions,
}: AudienceQuestionListProps) {
  const router = useRouter();
  const [sort, setSort] = useState<AudienceSort>("popular");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [votedQuestionIds, setVotedQuestionIds] = useState(() => new Set(initialVotedQuestionIds));
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
    });
  }, [eventId, fixtureMode, router]);

  function vote(question: PublicQuestion) {
    const formData = new FormData();
    formData.set("questionId", question.id);

    startTransition(async () => {
      const result = await voteQuestionAction(eventId, joinCode, formData);
      setMessage(result.message);

      if (!result.ok) return;

      setVotedQuestionIds((current) => new Set(current).add(question.id));
      setQuestionState((current) =>
        current.map((item) =>
          item.id === question.id
            ? {
                ...item,
                vote_count: result.result?.question.vote_count ?? item.vote_count + (votedQuestionIds.has(question.id) ? 0 : 1),
              }
            : item,
        ),
      );
    });
  }

  return (
    <section className="grid gap-3" aria-labelledby="approved-questions-heading">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <div className="grid gap-2">
          <h2
            className="text-[20px] font-semibold leading-[1.25] text-slate-900"
            id="approved-questions-heading"
          >
            Approved questions
          </h2>
          <ConnectionStatus onRefresh={() => router.refresh()} state={connectionState} />
        </div>
        <div aria-label="Sort approved questions" className="flex min-w-0 flex-wrap gap-2" role="radiogroup">
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

      {message ? (
        <div className="rounded-[6px] border border-teal-700 bg-white p-3 text-teal-700" role="status">
          <p className="text-sm font-semibold leading-[1.4]">{message}</p>
        </div>
      ) : null}

      {sortedQuestions.length === 0 ? (
        <div className="rounded-[6px] border border-slate-300 bg-white p-4">
          <p className="text-base leading-6 text-slate-600">No approved questions yet.</p>
        </div>
      ) : (
        <ul className="grid gap-3">
          {sortedQuestions.map((question, index) => {
            const isAnswered = question.status === "answered";
            const isVoted = votedQuestionIds.has(question.id);
            const disabled = isPending || isAnswered || isVoted;
            const isTopQuestion = sort === "popular" && index === 0 && question.vote_count > 0;

            return (
              <li
                className={[
                  "grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-[6px] border bg-white p-3 shadow-sm transition-colors sm:gap-4 sm:p-4",
                  isTopQuestion ? "border-teal-700" : "border-slate-300",
                  isAnswered ? "bg-slate-50" : "bg-white",
                ].join(" ")}
                data-testid="audience-question-card"
                key={question.id}
              >
                <button
                  aria-label={
                    isAnswered
                      ? `Voting closed for question ${question.current_text}`
                      : `Vote for question ${question.current_text}`
                  }
                  aria-pressed={isVoted}
                  className={[
                    "inline-flex min-h-16 w-14 shrink-0 flex-col items-center justify-center rounded-[6px] border px-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:min-h-[72px] sm:w-16",
                    isVoted
                      ? "border-teal-700 bg-teal-700 text-white"
                      : "border-slate-300 bg-white text-slate-900 hover:border-teal-700 hover:bg-teal-50 hover:text-teal-800",
                    isAnswered ? "bg-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-500" : "",
                  ].join(" ")}
                  disabled={disabled}
                  onClick={() => vote(question)}
                  type="button"
                >
                  <ChevronUp aria-hidden="true" className="h-5 w-5" strokeWidth={2.5} />
                  <span className="text-lg font-semibold leading-6">{question.vote_count}</span>
                  <span className="text-[11px] font-semibold uppercase leading-4 tracking-normal">
                    {question.vote_count === 1 ? "vote" : "votes"}
                  </span>
                </button>
                <div className="min-w-0 self-center">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {isTopQuestion ? (
                      <span className="rounded-[6px] border border-teal-700 bg-teal-50 px-2 py-1 text-xs font-semibold leading-[1.3] text-teal-800">
                        Top question
                      </span>
                    ) : null}
                    {isAnswered ? (
                      <span className="rounded-[6px] border border-slate-300 bg-white px-2 py-1 text-xs font-semibold leading-[1.3] text-slate-700">
                        Answered
                      </span>
                    ) : null}
                    {question.is_edited ? (
                      <span className="rounded-[6px] border border-slate-300 bg-white px-2 py-1 text-xs font-semibold leading-[1.3] text-slate-600">
                        Edited
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={[
                      "mt-2 break-words text-base font-medium leading-6",
                      isAnswered ? "text-slate-600" : "text-slate-950",
                    ].join(" ")}
                  >
                    {question.current_text}
                  </p>
                  {isVoted ? (
                    <p className="mt-2 text-sm font-semibold leading-[1.4] text-teal-700">Voted</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
