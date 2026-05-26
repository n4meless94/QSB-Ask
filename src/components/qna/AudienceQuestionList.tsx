"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

      window.addEventListener("qsb-ask:e2e-qna-refresh", refreshFromFixture);
      return () => window.removeEventListener("qsb-ask:e2e-qna-refresh", refreshFromFixture);
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
          <ConnectionStatus state={connectionState} />
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
          {sortedQuestions.map((question) => {
            const isAnswered = question.status === "answered";
            const isVoted = votedQuestionIds.has(question.id);
            const disabled = isPending || isAnswered || isVoted;

            return (
              <li
                className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4"
                data-testid="audience-question-card"
                key={question.id}
              >
                <div className="min-w-0">
                  <p className="break-words text-base leading-6 text-slate-900">{question.current_text}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm leading-[1.4] text-slate-600">
                    {question.is_edited ? <span>Edited</span> : null}
                    {isAnswered ? (
                      <span className="rounded-[6px] border border-slate-300 px-2 py-1 font-semibold text-slate-700">
                        Answered
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  aria-label={
                    isAnswered
                      ? `Voting closed for question ${question.current_text}`
                      : `Vote for question ${question.current_text}`
                  }
                  aria-pressed={isVoted}
                  className="inline-flex min-h-11 w-fit items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold leading-6 text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:min-h-10"
                  disabled={disabled}
                  onClick={() => vote(question)}
                  type="button"
                >
                  {question.vote_count} votes
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
