import "server-only";

import { assertEventRole } from "@/lib/events/access";
import { zonedDatetimeLocalToUtc } from "@/lib/time/zoned";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";
import type { Tables } from "@/lib/supabase/database.types";
import type { IdentityMode } from "@/types/app";

export type EventSettingsInput = {
  duplicate_block_enabled: boolean;
  identity_mode: IdentityMode;
  moderation_enabled: boolean;
  moderation_warning_acknowledged: boolean;
  name: string;
  participant_realtime_enabled: boolean;
  question_character_limit: number;
  question_rate_limit_seconds: number;
  starts_at: string;
  time_zone: string;
};

export type EventSettingsFieldErrors = Partial<Record<keyof EventSettingsInput, string>>;

type SettingsParseResult =
  | { success: true; data: EventSettingsInput }
  | { success: false; fieldErrors: EventSettingsFieldErrors };

const IDENTITY_MODES = ["anonymous", "name_required", "name_email_required"] as const;

function getAll(input: Record<string, unknown> | FormData, key: string) {
  if (input instanceof FormData) {
    return input.getAll(key);
  }

  return [input[key]];
}

function getString(input: Record<string, unknown> | FormData, key: string) {
  const value = getAll(input, key).at(-1);
  return typeof value === "string" ? value.trim() : String(value ?? "").trim();
}

function parseBoolean(input: Record<string, unknown> | FormData, key: string) {
  const values = getAll(input, key);

  if (values.length === 0) return false;

  return values.some((value) => {
    if (typeof value === "boolean") return value;
    if (typeof value !== "string") return false;

    return ["true", "on", "1", "yes"].includes(value);
  });
}

function parseNumber(input: Record<string, unknown> | FormData, key: string) {
  const value = Number(getString(input, key));
  return Number.isFinite(value) ? value : null;
}

function isIdentityMode(value: string): value is IdentityMode {
  return (IDENTITY_MODES as readonly string[]).includes(value);
}

export const eventSettingsSchema = {
  safeParse(input: Record<string, unknown> | FormData): SettingsParseResult {
    const name = getString(input, "name");
    const startsAt = getString(input, "starts_at");
    const timeZone = getString(input, "time_zone");
    const identityMode = getString(input, "identity_mode");
    const moderationEnabled = parseBoolean(input, "moderation_enabled");
    const moderationWarningAcknowledged = parseBoolean(input, "moderation_warning_acknowledged");
    const duplicateBlockEnabled = parseBoolean(input, "duplicate_block_enabled");
    const participantRealtimeEnabled = parseBoolean(input, "participant_realtime_enabled");
    const characterLimit = parseNumber(input, "question_character_limit");
    const rateLimit = parseNumber(input, "question_rate_limit_seconds");
    const fieldErrors: EventSettingsFieldErrors = {};

    if (!name) fieldErrors.name = "Event name is required.";

    if (!timeZone) fieldErrors.time_zone = "Time zone is required.";

    const startsAtUtc = timeZone ? zonedDatetimeLocalToUtc(startsAt, timeZone) : null;

    if (!startsAt || startsAtUtc === null) {
      fieldErrors.starts_at = "Event date/time is required.";
    }

    if (!identityMode || !isIdentityMode(identityMode)) {
      fieldErrors.identity_mode = "Choose a valid participant identity mode.";
    }

    if (characterLimit === null || characterLimit < 50 || characterLimit > 1000) {
      fieldErrors.question_character_limit =
        "Question character limit must be between 50 and 1000.";
    }

    if (rateLimit === null || rateLimit < 5 || rateLimit > 300) {
      fieldErrors.question_rate_limit_seconds = "Question rate limit must be between 5 and 300 seconds.";
    }

    if (!moderationEnabled && !moderationWarningAcknowledged) {
      fieldErrors.moderation_warning_acknowledged =
        "Confirm the moderation warning before turning moderation off.";
    }

    if (Object.keys(fieldErrors).length > 0 || !isIdentityMode(identityMode) || !startsAtUtc) {
      return { success: false, fieldErrors };
    }

    return {
      success: true,
      data: {
        duplicate_block_enabled: duplicateBlockEnabled,
        identity_mode: identityMode,
        moderation_enabled: moderationEnabled,
        moderation_warning_acknowledged: moderationWarningAcknowledged,
        name,
        participant_realtime_enabled: participantRealtimeEnabled,
        question_character_limit: characterLimit ?? 280,
        question_rate_limit_seconds: rateLimit ?? 30,
        starts_at: startsAtUtc,
        time_zone: timeZone,
      },
    };
  },
};

async function updateEventStatus(
  userId: string,
  eventId: string,
  status: Tables<"events">["status"],
) {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .update({ status })
    .eq("id", eventId)
    .select("id,status")
    .single();

  if (error || !data) {
    throw new Error("Event lifecycle could not be updated. Refresh the page and try again.");
  }

  return data;
}

export async function updateEventSettings(
  userId: string,
  eventId: string,
  input: Record<string, unknown> | FormData,
) {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);

  const parsed = eventSettingsSchema.safeParse(input);

  if (!parsed.success) {
    throw new Error("Fix the highlighted fields and try again.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("events")
    .update({
      duplicate_block_enabled: parsed.data.duplicate_block_enabled,
      identity_mode: parsed.data.identity_mode,
      moderation_enabled: parsed.data.moderation_enabled,
      name: parsed.data.name,
      participant_realtime_enabled: parsed.data.participant_realtime_enabled,
      question_character_limit: parsed.data.question_character_limit,
      question_rate_limit_seconds: parsed.data.question_rate_limit_seconds,
      starts_at: parsed.data.starts_at,
      time_zone: parsed.data.time_zone,
    })
    .eq("id", eventId)
    .select(
      "id,name,join_code,starts_at,time_zone,status,identity_mode,moderation_enabled,participant_realtime_enabled,question_character_limit,duplicate_block_enabled,question_rate_limit_seconds,created_by",
    )
    .single();

  if (error || !data) {
    throw new Error("Event settings could not be saved. Refresh the page and try again.");
  }

  return data;
}

export async function activateEvent(userId: string, eventId: string) {
  return updateEventStatus(userId, eventId, "active");
}

export async function moveEventToDraft(userId: string, eventId: string) {
  return updateEventStatus(userId, eventId, "draft");
}

export async function closeEvent(userId: string, eventId: string) {
  return updateEventStatus(userId, eventId, "ended");
}

export async function archiveEvent(userId: string, eventId: string) {
  return updateEventStatus(userId, eventId, "archived");
}
