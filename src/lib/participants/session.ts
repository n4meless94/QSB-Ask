import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { EventStatus, IdentityMode } from "@/types/app";

import {
  normaliseJoinCode,
  validateParticipantIdentity,
  type ParticipantIdentityInput,
} from "./validation";

export type JoinableEvent = Pick<
  Tables<"events">,
  "id" | "identity_mode" | "join_code" | "name" | "status"
>;

export type ParticipantSession = Pick<
  Tables<"participant_sessions">,
  "created_at" | "display_name" | "email" | "event_id" | "id" | "session_token_hash"
>;

const JOINABLE_EVENT_SELECT = "id,name,join_code,status,identity_mode";

function hashParticipantToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

function generateParticipantToken() {
  return randomBytes(32).toString("hex");
}

function isActiveStatus(status: EventStatus) {
  return status === "active";
}

function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function getParticipantCookieName(eventId: string) {
  return `qsb_ask_participant_${eventId}`;
}

export async function getJoinableEventByCode(joinCode: string): Promise<JoinableEvent | null> {
  const code = normaliseJoinCode(joinCode);

  if (!code) return null;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .select(JOINABLE_EVENT_SELECT)
    .eq("join_code", code)
    .single();

  if (error || !data || !isActiveStatus(data.status)) {
    return null;
  }

  return data;
}

export async function joinParticipantEvent(
  joinCode: string,
  identity: ParticipantIdentityInput,
) {
  const code = normaliseJoinCode(joinCode);

  if (!code) {
    throw new Error("Enter the event code shared by the organiser.");
  }

  const supabase = await createSupabaseServerClient();
  const { data: event, error: eventError } = await supabase
    .from("events")
    .select(JOINABLE_EVENT_SELECT)
    .eq("join_code", code)
    .single();

  if (eventError || !event) {
    throw new Error("We could not find an active event for that code.");
  }

  if (!isActiveStatus(event.status)) {
    throw new Error("This event is not open for joining.");
  }

  const participantIdentity = validateParticipantIdentity(event.identity_mode as IdentityMode, identity);
  const rawToken = generateParticipantToken();
  const sessionTokenHash = hashParticipantToken(rawToken);
  const { data: participantSession, error: sessionError } = await supabase
    .from("participant_sessions")
    .insert({
      display_name: participantIdentity.display_name,
      email: participantIdentity.email,
      event_id: event.id,
      session_token_hash: sessionTokenHash,
    })
    .select("id,event_id,display_name,email,session_token_hash,created_at")
    .single();

  if (sessionError || !participantSession) {
    throw new Error("Participant session could not be created. Try joining again.");
  }

  return {
    event,
    participantSession,
    rawToken,
  };
}

export async function validateParticipantSession(eventId: string, rawToken: string) {
  const tokenHash = hashParticipantToken(rawToken);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("participant_sessions")
    .select("id,event_id,display_name,email,session_token_hash,created_at")
    .eq("event_id", eventId)
    .eq("session_token_hash", tokenHash);

  if (error) {
    throw new Error("Participant session could not be verified.");
  }

  const session = (data ?? []).find(
    (candidate) =>
      candidate.event_id === eventId &&
      constantTimeEqual(candidate.session_token_hash, tokenHash),
  );

  if (!session) {
    throw new Error("Participant session is invalid.");
  }

  return session;
}
