import "server-only";

import { validateParticipantSession } from "@/lib/participants/session";
import type { Tables } from "@/lib/supabase/database.types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VoteResult = {
  alreadyVoted: boolean;
  question: Tables<"questions">;
};

type UpvoteRpcRow = {
  already_voted: boolean;
  question: Tables<"questions">;
};

export async function upvoteQuestion(eventId: string, rawToken: string, questionId: string) {
  if (!questionId) {
    throw new Error("Choose a question to vote on.");
  }

  const participantSession = await validateParticipantSession(eventId, rawToken);
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("upvote_question", {
    target_event_id: eventId,
    target_participant_session_id: participantSession.id,
    target_question_id: questionId,
  });

  if (error) {
    throw new Error(error.message || "Vote could not be recorded.");
  }

  const result = (data as UpvoteRpcRow[] | null)?.[0];

  if (!result?.question) {
    throw new Error("Only live approved questions can be voted on.");
  }

  return {
    alreadyVoted: result.already_voted,
    question: result.question,
  } satisfies VoteResult;
}

export async function listParticipantVoteQuestionIds(eventId: string, rawToken: string) {
  const participantSession = await validateParticipantSession(eventId, rawToken);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("question_votes")
    .select("question_id")
    .eq("participant_session_id", participantSession.id);

  if (error) {
    throw new Error("Your votes could not be loaded.");
  }

  return (data ?? []).map((vote) => vote.question_id);
}
