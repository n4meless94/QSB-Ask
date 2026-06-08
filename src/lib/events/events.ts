import "server-only";

import { getRuntimeEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/database.types";
import type { CreateEventInput } from "@/lib/events/validation";
import { createEventSchema } from "@/lib/events/validation";

export type EventSummary = Pick<
  Tables<"events">,
  | "id"
  | "name"
  | "join_code"
  | "starts_at"
  | "time_zone"
  | "status"
  | "identity_mode"
  | "moderation_enabled"
  | "participant_realtime_enabled"
  | "question_character_limit"
  | "duplicate_block_enabled"
  | "question_rate_limit_seconds"
  | "created_by"
>;

type EventMembershipRow = {
  events: EventSummary | EventSummary[] | null;
};

function normaliseEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() || "";
}

function displayNameFromEmail(email: string) {
  const localPart = email.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return localPart || email;
}

export function buildJoinLink(joinCode: string) {
  const base = getRuntimeEnv().appJoinUrlBase.replace(/\/+$/, "");
  return `${base}/${joinCode}`;
}

export async function listAccessibleEvents(userId: string): Promise<EventSummary[]> {
  if (!userId) {
    throw new Error("Signed-in user is required to list events.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("event_members")
    .select(
      "events(id,name,join_code,starts_at,time_zone,status,identity_mode,moderation_enabled,participant_realtime_enabled,question_character_limit,duplicate_block_enabled,question_rate_limit_seconds,created_by)",
    )
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Events could not be loaded. Refresh the page or try again.");
  }

  return ((data ?? []) as EventMembershipRow[])
    .flatMap((row) => (Array.isArray(row.events) ? row.events : row.events ? [row.events] : []))
    .filter((event) => event.created_by === userId || Boolean(event.id));
}

export async function createEventForOrganiser(
  userId: string,
  input: CreateEventInput | Record<string, unknown>,
): Promise<EventSummary> {
  if (!userId) {
    throw new Error("Signed-in user is required to create an event.");
  }

  const parsed = createEventSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Fix the highlighted fields and try again.");
  }

  const supabase = await createSupabaseServerClient();
  const organiserEmail = normaliseEmail(parsed.data.organiserEmail);

  if (organiserEmail) {
    const { error: profileError } = await supabase.from("users").upsert(
      {
        id: userId,
        email: organiserEmail,
        display_name: displayNameFromEmail(organiserEmail),
      },
      { onConflict: "id" },
    );

    if (profileError) {
      throw new Error("Event could not be saved. Check your account profile and try again.");
    }
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      created_by: userId,
      name: parsed.data.name,
      starts_at: parsed.data.starts_at,
      time_zone: parsed.data.time_zone,
      status: parsed.data.status,
      identity_mode: parsed.data.identity_mode,
      moderation_enabled: parsed.data.moderation_enabled,
      participant_realtime_enabled: true,
      question_character_limit: parsed.data.question_character_limit,
      duplicate_block_enabled: parsed.data.duplicate_block_enabled,
      question_rate_limit_seconds: parsed.data.question_rate_limit_seconds,
    })
    .select(
      "id,name,join_code,starts_at,time_zone,status,identity_mode,moderation_enabled,participant_realtime_enabled,question_character_limit,duplicate_block_enabled,question_rate_limit_seconds,created_by",
    )
    .single();

  if (eventError || !event) {
    throw new Error("Event could not be saved. Check the details and try again.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("event_members")
    .select("event_id,user_id,role,status")
    .eq("event_id", event.id)
    .eq("user_id", userId)
    .eq("role", "organiser")
    .eq("status", "active")
    .single();

  if (membershipError || !membership) {
    throw new Error("Event was saved but organiser access could not be verified.");
  }

  return event;
}
