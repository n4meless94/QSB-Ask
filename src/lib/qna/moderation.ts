import "server-only";

import { assertEventRole } from "@/lib/events/access";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MODERATION_ROLES } from "@/lib/supabase/rls";
import {
  STALE_MODERATION_MESSAGE,
  type ModerationHistoryEntry,
  type ModerationQuestion,
  type ModerationQueueStatus,
  type ModerationSort,
} from "@/lib/qna/moderation-shared";
import type { ModerationAction, QuestionStatus } from "@/types/app";

export {
  STALE_MODERATION_MESSAGE,
  type ModerationHistoryEntry,
  type ModerationQuestion,
  type ModerationQueueStatus,
  type ModerationSort,
} from "@/lib/qna/moderation-shared";

type QuestionRow = Tables<"questions"> & {
  participant_sessions?:
    | { display_name: string | null; email: string | null }
    | Array<{ display_name: string | null; email: string | null }>
    | null;
};

type ModerationResult = Tables<"questions">;

type ExpectedState = {
  expectedStatus: QuestionStatus;
  expectedUpdatedAt: string;
};

type EditInput = ExpectedState & {
  nextText: string;
};

type ModerationListOptions = {
  search?: string;
  sort: ModerationSort;
  status: ModerationQueueStatus;
};

const QUESTION_SELECT =
  "id,event_id,participant_session_id,current_text,status,previous_status,vote_count,is_edited,submitted_at,updated_at,participant_sessions(display_name,email)";

function normaliseQuestionText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function firstParticipant(row: QuestionRow) {
  if (Array.isArray(row.participant_sessions)) {
    return row.participant_sessions[0] ?? null;
  }

  return row.participant_sessions ?? null;
}

function toModerationQuestion(row: QuestionRow): ModerationQuestion {
  const participant = firstParticipant(row);

  return {
    current_text: row.current_text,
    id: row.id,
    is_edited: row.is_edited,
    participantEmail: participant?.email ?? null,
    participantIdentity: participant?.display_name?.trim() || "Anonymous",
    previous_status: row.previous_status,
    status: row.status,
    submitted_at: row.submitted_at,
    updated_at: row.updated_at,
    vote_count: row.vote_count,
  };
}

function orderQuestions(
  query: ReturnType<Awaited<ReturnType<typeof createSupabaseServerClient>>["from"]>,
  sort: ModerationSort,
) {
  if (sort === "oldest") {
    return query.order("submitted_at", { ascending: true });
  }

  if (sort === "most_votes") {
    return query.order("vote_count", { ascending: false }).order("submitted_at", { ascending: false });
  }

  return query.order("submitted_at", { ascending: false });
}

export async function listModerationQuestions(
  userId: string,
  eventId: string,
  options: ModerationListOptions,
): Promise<ModerationQuestion[]> {
  await assertEventRole(userId, eventId, MODERATION_ROLES);

  const supabase = await createSupabaseServerClient();
  let query = supabase
    .from("questions")
    .select(QUESTION_SELECT)
    .eq("event_id", eventId)
    .eq("status", options.status);

  const search = options.search?.trim();

  if (search) {
    query = query.ilike("current_text", `%${search}%`);
  }

  const { data, error } = await orderQuestions(query, options.sort);

  if (error) {
    throw new Error("Moderation queue could not be loaded.");
  }

  return ((data ?? []) as QuestionRow[]).map(toModerationQuestion);
}

export async function listModerationHistory(
  userId: string,
  eventId: string,
): Promise<ModerationHistoryEntry[]> {
  await assertEventRole(userId, eventId, MODERATION_ROLES);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("moderation_actions")
    .select("id,question_id,event_id,actor_user_id,action,from_status,to_status,metadata,created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Moderation history could not be loaded.");
  }

  return (data ?? []) as ModerationHistoryEntry[];
}

function firstRpcQuestion(data: ModerationResult[] | null) {
  const question = data?.[0];

  if (!question) {
    throw new Error(STALE_MODERATION_MESSAGE);
  }

  return question;
}

async function runModerationRpc({
  action,
  eventId,
  expectedStatus,
  expectedUpdatedAt,
  metadata = {},
  questionId,
  targetStatus,
  userId,
}: ExpectedState & {
  action: ModerationAction;
  eventId: string;
  metadata?: Json;
  questionId: string;
  targetStatus: QuestionStatus | null;
  userId: string;
}) {
  await assertEventRole(userId, eventId, MODERATION_ROLES);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("moderate_question_action", {
    action_metadata: metadata,
    actor_user_id: userId,
    expected_status: expectedStatus,
    expected_updated_at: expectedUpdatedAt,
    moderation_action: action,
    target_event_id: eventId,
    target_question_id: questionId,
    target_status: targetStatus,
  });

  if (error) {
    throw new Error(error.message || "This moderation action could not be saved.");
  }

  return firstRpcQuestion(data);
}

export async function approveQuestion(
  userId: string,
  eventId: string,
  questionId: string,
  expected: ExpectedState,
) {
  return runModerationRpc({
    action: "approve",
    eventId,
    questionId,
    targetStatus: "live",
    userId,
    ...expected,
  });
}

export async function dismissQuestion(
  userId: string,
  eventId: string,
  questionId: string,
  expected: ExpectedState,
) {
  return runModerationRpc({
    action: "dismiss",
    eventId,
    metadata: { dismissed: true },
    questionId,
    targetStatus: "archived",
    userId,
    ...expected,
  });
}

export async function archiveQuestion(
  userId: string,
  eventId: string,
  questionId: string,
  expected: ExpectedState,
) {
  return runModerationRpc({
    action: "archive",
    eventId,
    questionId,
    targetStatus: "archived",
    userId,
    ...expected,
  });
}

export async function restoreQuestion(
  userId: string,
  eventId: string,
  questionId: string,
  expected: ExpectedState,
) {
  return runModerationRpc({
    action: "restore",
    eventId,
    questionId,
    targetStatus: null,
    userId,
    ...expected,
  });
}

export async function markQuestionAnswered(
  userId: string,
  eventId: string,
  questionId: string,
  expected: ExpectedState,
) {
  return runModerationRpc({
    action: "mark_answered",
    eventId,
    questionId,
    targetStatus: "answered",
    userId,
    ...expected,
  });
}

export async function editQuestion(
  userId: string,
  eventId: string,
  questionId: string,
  input: EditInput,
) {
  await assertEventRole(userId, eventId, MODERATION_ROLES);

  const nextText = normaliseQuestionText(input.nextText);

  if (!nextText) {
    throw new Error("Question text is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("edit_question_action", {
    actor_user_id: userId,
    expected_status: input.expectedStatus,
    expected_updated_at: input.expectedUpdatedAt,
    next_text: nextText,
    target_event_id: eventId,
    target_question_id: questionId,
  });

  if (error) {
    throw new Error(error.message || "Question edit could not be saved.");
  }

  return firstRpcQuestion(data);
}
