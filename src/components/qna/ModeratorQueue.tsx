"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  archiveQuestionAction,
  approveQuestionAction,
  dismissQuestionAction,
  editQuestionAction,
  markQuestionAnsweredAction,
  restoreQuestionAction,
} from "@/app/(app)/events/[eventId]/qna-actions";
import { ConnectionStatus } from "@/components/qna/ConnectionStatus";
import { ModerationHistoryPanel } from "@/components/qna/ModerationHistoryPanel";
import { Button } from "@/components/ui/Button";
import {
  type ModerationHistoryEntry,
  type ModerationQuestion,
  STALE_MODERATION_MESSAGE,
} from "@/lib/qna/moderation-shared";
import { subscribeToModeratorQuestions, type QnaConnectionState } from "@/lib/qna/realtime";
import type { ModerationAction, QuestionStatus } from "@/types/app";

type QueueStatus = "pending" | "live" | "answered" | "archived";
type QueueSort = "most_recent" | "oldest" | "most_votes";
type ActionVerb = "approve" | "dismiss" | "archive" | "restore" | "mark_answered";

type ModeratorQueueProps = {
  eventId: string;
  fixtureMode?: boolean;
  history: ModerationHistoryEntry[];
  questions: ModerationQuestion[];
};

const tabs: Array<{ id: QueueStatus; label: string }> = [
  { id: "pending", label: "Pending" },
  { id: "live", label: "Live" },
  { id: "answered", label: "Answered" },
  { id: "archived", label: "Archived" },
];

const statusLabels: Record<QuestionStatus, string> = {
  answered: "Answered",
  archived: "Archived",
  live: "Live",
  pending: "Pending",
};

const actionMessages: Record<ActionVerb, string> = {
  approve: "Question approved.",
  archive: "Question archived.",
  dismiss: "Question dismissed.",
  mark_answered: "Question marked answered.",
  restore: "Question restored.",
};

const actionToServer: Record<ActionVerb, (eventId: string, formData: FormData) => Promise<{ ok: boolean; message: string }>> = {
  approve: approveQuestionAction,
  archive: archiveQuestionAction,
  dismiss: dismissQuestionAction,
  mark_answered: markQuestionAnsweredAction,
  restore: restoreQuestionAction,
};

function tabClasses(active: boolean) {
  return [
    "min-h-11 rounded-[6px] border px-3 text-base font-semibold leading-6 outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10",
    active
      ? "border-teal-700 bg-white text-teal-700"
      : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
  ].join(" ");
}

function statusBadgeClasses(status: QuestionStatus) {
  if (status === "pending") {
    return "border-amber-700 bg-white text-amber-700";
  }

  if (status === "live") {
    return "border-teal-700 bg-white text-teal-700";
  }

  return "border-slate-400 bg-slate-100 text-slate-700";
}

function compareQuestions(sort: QueueSort) {
  return (a: ModerationQuestion, b: ModerationQuestion) => {
    if (sort === "oldest") {
      return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
    }

    if (sort === "most_votes") {
      return b.vote_count - a.vote_count || new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
    }

    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  };
}

function toFormData(question: ModerationQuestion, text?: string) {
  const formData = new FormData();
  formData.set("questionId", question.id);
  formData.set("expectedStatus", question.status);
  formData.set("expectedUpdatedAt", question.updated_at);

  if (text !== undefined) {
    formData.set("text", text);
  }

  return formData;
}

function statusAfterAction(question: ModerationQuestion, action: ActionVerb): QuestionStatus {
  if (action === "approve") return "live";
  if (action === "archive" || action === "dismiss") return "archived";
  if (action === "mark_answered") return "answered";
  if (action === "restore") return question.previous_status ?? "live";

  return question.status;
}

function historyEntry(
  question: ModerationQuestion,
  action: ModerationAction,
  toStatus: QuestionStatus,
): ModerationHistoryEntry {
  return {
    action,
    actor_user_id: "moderator-1",
    created_at: new Date().toISOString(),
    from_status: question.status,
    id: `${action}-${question.id}-${Date.now()}`,
    metadata: {},
    question_id: question.id,
    to_status: toStatus,
  };
}

export function ModeratorQueue({
  eventId,
  fixtureMode = false,
  history,
  questions,
}: ModeratorQueueProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<QueueStatus>("pending");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<QueueSort>("most_recent");
  const [message, setMessage] = useState("");
  const [items, setItems] = useState(questions);
  const [historyItems, setHistoryItems] = useState(history);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);
  const [connectionState, setConnectionState] = useState<QnaConnectionState>("live");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (fixtureMode) {
      function refreshFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ moderationQuestions?: ModerationQuestion[] }>).detail;

        if (detail?.moderationQuestions) {
          setItems(detail.moderationQuestions);
          setConnectionState("live");
        }
      }

      function connectionFromFixture(event: Event) {
        const detail = (event as CustomEvent<{ state?: QnaConnectionState }>).detail;

        if (detail?.state) {
          setConnectionState(detail.state);
        }
      }

      window.addEventListener("qsb-ask:e2e-moderation-refresh", refreshFromFixture);
      window.addEventListener("qsb-ask:e2e-qna-connection", connectionFromFixture);
      return () => {
        window.removeEventListener("qsb-ask:e2e-moderation-refresh", refreshFromFixture);
        window.removeEventListener("qsb-ask:e2e-qna-connection", connectionFromFixture);
      };
    }

    return subscribeToModeratorQuestions({
      eventId,
      onConnectionChange: setConnectionState,
      onRefresh: () => router.refresh(),
      refreshIntervalMs: 2000,
    });
  }, [eventId, fixtureMode, router]);

  const counts = useMemo(
    () =>
      tabs.reduce(
        (accumulator, tab) => ({
          ...accumulator,
          [tab.id]: items.filter((question) => question.status === tab.id).length,
        }),
        {} as Record<QueueStatus, number>,
      ),
    [items],
  );

  const visibleQuestions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return items
      .filter((question) => question.status === activeTab)
      .filter((question) =>
        normalizedSearch ? question.current_text.toLowerCase().includes(normalizedSearch) : true,
      )
      .sort(compareQuestions(sort));
  }, [activeTab, items, search, sort]);

  function updateFixtureQuestion(question: ModerationQuestion, action: ActionVerb) {
    const nextStatus = statusAfterAction(question, action);
    setItems((current) =>
      current.map((item) =>
        item.id === question.id
          ? {
              ...item,
              previous_status:
                nextStatus === "archived" ? item.status : action === "restore" ? null : item.previous_status,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            }
          : item,
      ),
    );
    setHistoryItems((current) => [historyEntry(question, action, nextStatus), ...current]);
    setMessage(actionMessages[action]);
  }

  function runQuestionAction(question: ModerationQuestion, action: ActionVerb) {
    setPendingActionId(question.id);
    setMessage("");

    if (fixtureMode) {
      updateFixtureQuestion(question, action);
      setPendingActionId(null);
      return;
    }

    startTransition(async () => {
      const result = await actionToServer[action](eventId, toFormData(question));
      setMessage(result.message);
      setPendingActionId(null);
    });
  }

  function saveEdit(question: ModerationQuestion) {
    const nextText = editText.trim().replace(/\s+/g, " ");

    if (!nextText) {
      setMessage("Question text is required.");
      return;
    }

    setPendingActionId(question.id);
    setMessage("");

    if (fixtureMode) {
      const editedQuestion = {
        ...question,
        current_text: nextText,
        is_edited: true,
        updated_at: new Date().toISOString(),
      };
      setItems((current) => current.map((item) => (item.id === question.id ? editedQuestion : item)));
      setHistoryItems((current) => [
        {
          ...historyEntry(question, "edit", question.status),
          metadata: { next_text: nextText },
        },
        ...current,
      ]);
      setEditingId(null);
      setMessage("Question edited.");
      setPendingActionId(null);
      return;
    }

    startTransition(async () => {
      const result = await editQuestionAction(eventId, toFormData(question, nextText));
      setMessage(result.message);
      setPendingActionId(null);
      setEditingId(null);
    });
  }

  function beginEdit(question: ModerationQuestion) {
    setEditingId(question.id);
    setEditText(question.current_text);
    setMessage("");
  }

  function simulateStaleUpdate() {
    setMessage(STALE_MODERATION_MESSAGE);
  }

  return (
    <div className="grid gap-4">
      <section
        aria-labelledby="moderation-queue-heading"
        className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
      >
        <div className="grid gap-1">
          <h2
            className="text-[20px] font-semibold leading-[1.25] text-slate-900"
            id="moderation-queue-heading"
          >
            Moderation queue
          </h2>
          <p className="text-sm leading-[1.4] text-slate-600">
            Review audience questions before they become visible to participants and speakers.
          </p>
          <ConnectionStatus onRefresh={() => router.refresh()} state={connectionState} />
        </div>

        {message ? (
          <div
            className={`rounded-[6px] border bg-white p-3 text-sm font-semibold leading-[1.4] ${
              message === STALE_MODERATION_MESSAGE
                ? "border-amber-700 text-amber-700"
                : "border-teal-700 text-teal-700"
            }`}
            role={message === STALE_MODERATION_MESSAGE ? "alert" : "status"}
          >
            {message}
          </div>
        ) : null}

        <div
          aria-label="Moderation queue statuses"
          className="grid grid-cols-2 gap-2 md:flex md:flex-wrap"
          role="tablist"
        >
          {tabs.map((tab) => (
            <button
              aria-controls={`${tab.id}-questions`}
              aria-selected={activeTab === tab.id}
              className={tabClasses(activeTab === tab.id)}
              id={`${tab.id}-queue-tab`}
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              type="button"
            >
              {tab.label} {counts[tab.id]}
            </button>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <div className="grid gap-2">
            <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="qna-search">
              Search questions
            </label>
            <input
              className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
              id="qna-search"
              onChange={(event) => setSearch(event.target.value)}
              type="search"
              value={search}
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor="qna-sort">
              Sort questions
            </label>
            <select
              className="min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10"
              id="qna-sort"
              onChange={(event) => setSort(event.target.value as QueueSort)}
              value={sort}
            >
              <option value="most_recent">Most recent</option>
              <option value="oldest">Oldest</option>
              <option value="most_votes">Most votes</option>
            </select>
          </div>
        </div>

        <div aria-labelledby={`${activeTab}-queue-tab`} className="grid gap-3" id={`${activeTab}-questions`} role="tabpanel">
          {visibleQuestions.length === 0 ? (
            <div className="rounded-[6px] border border-slate-300 bg-white p-4">
              <h3 className="text-[20px] font-semibold leading-[1.25] text-slate-900">
                {search ? "No questions match your search." : `No ${activeTab} questions`}
              </h3>
              <p className="mt-1 text-sm leading-[1.4] text-slate-600">
                {activeTab === "pending"
                  ? "New audience questions will appear here for review."
                  : "Question records for this state will appear here."}
              </p>
            </div>
          ) : (
            visibleQuestions.map((question) => {
              const isEditing = editingId === question.id;
              const busy = pendingActionId === question.id || isPending || connectionState === "offline";

              return (
                <article
                  className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4"
                  key={question.id}
                >
                  <header className="flex flex-wrap items-center gap-2 text-sm leading-[1.4] text-slate-600">
                    <span
                      className={`rounded-[6px] border px-2 py-1 font-semibold ${statusBadgeClasses(
                        question.status,
                      )}`}
                    >
                      {statusLabels[question.status]}
                    </span>
                    <span>{question.vote_count} votes</span>
                    <time dateTime={question.submitted_at}>
                      {new Date(question.submitted_at).toLocaleString("en-MY", {
                        dateStyle: "medium",
                        timeStyle: "short",
                        timeZone: "Asia/Kuala_Lumpur",
                      })}
                    </time>
                  </header>

                  {isEditing ? (
                    <div className="grid gap-2">
                      <label
                        className="text-sm font-semibold leading-[1.4] text-slate-900"
                        htmlFor={`edit-${question.id}`}
                      >
                        Edit question text
                      </label>
                      <textarea
                        autoFocus
                        className="min-h-28 rounded-[6px] border border-slate-300 bg-white px-3 py-2 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
                        id={`edit-${question.id}`}
                        onChange={(event) => setEditText(event.target.value)}
                        value={editText}
                      />
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button loading={busy} onClick={() => saveEdit(question)}>
                          Save edit
                        </Button>
                        <Button onClick={() => setEditingId(null)} variant="secondary">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="break-words text-base leading-6 text-slate-900">{question.current_text}</p>
                  )}

                  <footer className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="flex flex-wrap items-center gap-2 text-sm leading-[1.4] text-slate-600">
                      <span>{question.participantIdentity}</span>
                      {question.is_edited ? (
                        <span className="rounded-[6px] border border-slate-300 px-2 py-1 font-semibold text-slate-700">
                          Edited
                        </span>
                      ) : null}
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
                      {question.status === "pending" ? (
                        <Button
                          aria-label={`Approve question ${question.current_text}`}
                          loading={busy}
                          onClick={() => runQuestionAction(question, "approve")}
                        >
                          Approve question
                        </Button>
                      ) : null}
                      {question.status === "live" ? (
                        <Button
                          aria-label={`Mark answered ${question.current_text}`}
                          loading={busy}
                          onClick={() => runQuestionAction(question, "mark_answered")}
                        >
                          Mark answered
                        </Button>
                      ) : null}
                      {question.status === "archived" || question.status === "answered" ? (
                        <Button
                          aria-label={`Restore question ${question.current_text}`}
                          loading={busy}
                          onClick={() => runQuestionAction(question, "restore")}
                          variant="secondary"
                        >
                          Restore question
                        </Button>
                      ) : null}
                      {question.status !== "archived" ? (
                        <>
                          <Button
                            aria-label={`Edit question ${question.current_text}`}
                            disabled={busy}
                            onClick={() => beginEdit(question)}
                            variant="secondary"
                          >
                            Edit
                          </Button>
                          {question.status === "pending" ? (
                            <Button
                              aria-label={`Dismiss question ${question.current_text}`}
                              loading={busy}
                              onClick={() => runQuestionAction(question, "dismiss")}
                              variant="secondary"
                            >
                              Dismiss
                            </Button>
                          ) : null}
                          <Button
                            aria-label={`Archive question ${question.current_text}`}
                            loading={busy}
                            onClick={() => runQuestionAction(question, "archive")}
                            variant="destructive"
                          >
                            Archive
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </footer>
                </article>
              );
            })
          )}
        </div>

        {fixtureMode ? (
          <div>
            <Button onClick={simulateStaleUpdate} variant="secondary">
              Simulate stale update
            </Button>
          </div>
        ) : null}
        {connectionState === "offline" ? (
          <p className="text-sm font-semibold leading-[1.4] text-amber-700" role="status">
            Reconnect to continue.
          </p>
        ) : null}
      </section>

      <ModerationHistoryPanel history={historyItems} />
    </div>
  );
}
