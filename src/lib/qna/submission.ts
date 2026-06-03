import "server-only";

import { validateParticipantSession } from "@/lib/participants/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type EventQuestionRules = {
  duplicate_block_enabled: boolean;
  id: string;
  moderation_enabled: boolean;
  name: string;
  question_character_limit: number;
  question_rate_limit_seconds: number;
  status: "draft" | "active" | "ended" | "archived";
};

type PreviousQuestion = {
  current_text: string;
  submitted_at: string;
};

function normaliseQuestionText(text: string) {
  return text.trim().replace(/\s+/g, " ");
}

function duplicateKey(text: string) {
  return normaliseQuestionText(text).toLowerCase();
}

export async function submitParticipantQuestion(eventId: string, rawToken: string, text: string) {
  const participantSession = await validateParticipantSession(eventId, rawToken);
  const questionText = normaliseQuestionText(text);
  const supabase = createSupabaseAdminClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(
      "id,name,status,moderation_enabled,question_character_limit,duplicate_block_enabled,question_rate_limit_seconds",
    )
    .eq("id", eventId)
    .single();

  if (eventError || !event) {
    throw new Error("Event could not be loaded.");
  }

  const eventRules = event as EventQuestionRules;

  if (eventRules.status !== "active") {
    throw new Error("This event is closed.");
  }

  if (!questionText) {
    throw new Error("Question is required.");
  }

  if (questionText.length > eventRules.question_character_limit) {
    throw new Error(`Question must be ${eventRules.question_character_limit} characters or fewer.`);
  }

  const { data: previousQuestions, error: previousError } = await supabase
    .from("questions")
    .select("current_text,submitted_at")
    .eq("event_id", eventId)
    .eq("participant_session_id", participantSession.id)
    .order("submitted_at", { ascending: false });

  if (previousError) {
    throw new Error("Question history could not be checked.");
  }

  const previous = (previousQuestions ?? []) as PreviousQuestion[];
  const newest = previous[0];

  if (newest) {
    const elapsedSeconds = (Date.now() - new Date(newest.submitted_at).getTime()) / 1000;

    if (elapsedSeconds < eventRules.question_rate_limit_seconds) {
      throw new Error("Please wait before submitting another question.");
    }
  }

  if (
    eventRules.duplicate_block_enabled &&
    previous.some((question) => duplicateKey(question.current_text) === duplicateKey(questionText))
  ) {
    throw new Error("This question looks like one you already submitted.");
  }

  const { data: question, error: questionError } = await supabase
    .from("questions")
    .insert({
      current_text: questionText,
      event_id: eventId,
      participant_session_id: participantSession.id,
      status: eventRules.moderation_enabled ? "pending" : "live",
    })
    .select(
      "id,event_id,participant_session_id,current_text,status,vote_count,is_edited,submitted_at,updated_at",
    )
    .single();

  if (questionError || !question) {
    throw new Error("Question could not be submitted. Try again.");
  }

  const { error: versionError } = await supabase.from("question_versions").insert({
    question_id: question.id,
    text: questionText,
    version_number: 1,
  });

  if (versionError) {
    throw new Error("Question was saved but its version history could not be recorded.");
  }

  return question;
}
