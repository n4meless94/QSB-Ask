"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronUp, Pencil } from "lucide-react";

import { voteQuestionAction } from "@/app/join/[joinCode]/qna/vote-actions";
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
  const [, setConnectionState] = useState<QnaConnectionState>("live");
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
    <section className="grid gap-4" aria-labelledby="approved-questions-heading">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
        <h2
          className="text-[26px] font-semibold leading-[1.15] text-slate-950"
          id="approved-questions-heading"
        >
          Questions
        </h2>
        <div
          aria-label="Sort approved questions"
          className="inline-flex w-fit rounded-[14px] border border-slate-200 bg-white p-1 shadow-sm"
          role="radiogroup"
        >
          {(["popular", "recent"] as const).map((option) => (
            <button
              aria-checked={sort === option}
              className={[
                "inline-flex min-h-10 min-w-24 items-center justify-center rounded-[11px] px-4 text-sm font-semibold leading-[1.4] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2",
                sort === option
                  ? "bg-[#008578] text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
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
        <div className="rounded-[14px] border border-teal-100 bg-teal-50 p-3 text-[#00796B]" role="status">
          <p className="text-sm font-semibold leading-[1.4]">{message}</p>
        </div>
      ) : null}

      {sortedQuestions.length === 0 ? (
        <div className="rounded-[16px] border border-dashed border-slate-300 bg-white/75 p-8 text-center shadow-sm">
          <p className="text-base font-semibold leading-6 text-slate-700">No questions yet. Be the first to ask.</p>
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
                  "grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[16px] border p-4 shadow-sm transition-colors sm:p-5",
                  isTopQuestion ? "border-[#008578] bg-teal-50/40" : "border-slate-200 bg-white",
                  isAnswered ? "opacity-85" : "",
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
                    "inline-flex min-h-[76px] w-16 shrink-0 flex-col items-center justify-center rounded-[12px] border px-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#008578] focus-visible:ring-offset-2 disabled:cursor-not-allowed sm:min-h-[84px] sm:w-[72px]",
                    isVoted
                      ? "border-[#008578] bg-[#008578] text-white"
                      : "border-slate-200 bg-white text-[#00796B] hover:border-[#008578] hover:bg-white",
                    isAnswered ? "bg-slate-50 text-slate-500 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-500" : "",
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
                      <span className="rounded-full bg-teal-100 px-3 py-1 text-xs font-semibold leading-[1.3] text-[#00796B]">
                        Top question
                      </span>
                    ) : null}
                    {isAnswered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold leading-[1.3] text-emerald-700">
                        <CheckCircle2 aria-hidden="true" className="h-3.5 w-3.5" />
                        Answered
                      </span>
                    ) : null}
                    {question.is_edited ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold leading-[1.3] text-slate-600">
                        <Pencil aria-hidden="true" className="h-3.5 w-3.5" />
                        Edited
                      </span>
                    ) : null}
                  </div>
                  <p
                    className={[
                      "mt-2 break-words text-[18px] font-semibold leading-7",
                      isAnswered ? "text-slate-700" : "text-slate-950",
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
