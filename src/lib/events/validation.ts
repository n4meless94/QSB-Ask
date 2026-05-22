import type { EventStatus, IdentityMode } from "@/types/app";

export const EVENT_STATUSES = ["draft", "active", "ended"] as const satisfies EventStatus[];
export const IDENTITY_MODES = [
  "anonymous",
  "name_required",
  "name_email_required",
] as const satisfies IdentityMode[];

export type CreateEventField = {
  name: string;
  starts_at: string;
  time_zone: string;
  status: string;
  identity_mode: string;
  moderation_enabled: string | boolean;
  organiserEmail?: string | null;
};

export type CreateEventInput = {
  name: string;
  starts_at: string;
  time_zone: string;
  status: EventStatus;
  identity_mode: IdentityMode;
  moderation_enabled: boolean;
  question_character_limit: number;
  duplicate_block_enabled: boolean;
  question_rate_limit_seconds: number;
  organiserEmail?: string | null;
};

export type CreateEventFieldErrors = Partial<Record<keyof CreateEventField, string>>;

type ParseSuccess = {
  success: true;
  data: CreateEventInput;
};

type ParseFailure = {
  success: false;
  fieldErrors: CreateEventFieldErrors;
};

export type CreateEventParseResult = ParseSuccess | ParseFailure;

const DEFAULT_QUESTION_CHARACTER_LIMIT = 280;
const DEFAULT_QUESTION_RATE_LIMIT_SECONDS = 30;

function getValue(input: Record<string, unknown> | FormData, key: keyof CreateEventField) {
  if (input instanceof FormData) {
    const value = input.get(key);
    return typeof value === "string" ? value : "";
  }

  const value = input[key];
  return typeof value === "boolean" ? value : String(value ?? "");
}

function parseModeration(value: string | boolean | unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return null;

  if (["true", "on", "1", "yes"].includes(value)) return true;
  if (["false", "off", "0", "no"].includes(value)) return false;

  return null;
}

function isEventStatus(value: string): value is EventStatus {
  return (EVENT_STATUSES as readonly string[]).includes(value);
}

function isIdentityMode(value: string): value is IdentityMode {
  return (IDENTITY_MODES as readonly string[]).includes(value);
}

export const createEventSchema = {
  safeParse(input: Record<string, unknown> | FormData, now = new Date()): CreateEventParseResult {
    const name = String(getValue(input, "name")).trim();
    const startsAt = String(getValue(input, "starts_at")).trim();
    const timeZone = String(getValue(input, "time_zone")).trim();
    const status = String(getValue(input, "status")).trim();
    const identityMode = String(getValue(input, "identity_mode")).trim();
    const moderationEnabled = parseModeration(getValue(input, "moderation_enabled"));
    const fieldErrors: CreateEventFieldErrors = {};
    let parsedStatus: EventStatus | null = null;
    let parsedIdentityMode: IdentityMode | null = null;

    if (!name) {
      fieldErrors.name = "Event name is required.";
    }

    if (!startsAt) {
      fieldErrors.starts_at = "Event date/time is required.";
    } else {
      const parsedStart = new Date(startsAt);

      if (Number.isNaN(parsedStart.getTime())) {
        fieldErrors.starts_at = "Event date/time is required.";
      } else if (parsedStart.getTime() <= now.getTime()) {
        fieldErrors.starts_at = "Event date/time cannot be in the past.";
      }
    }

    if (!timeZone) {
      fieldErrors.time_zone = "Time zone is required.";
    }

    if (!status) {
      fieldErrors.status = "Status is required.";
    } else if (!isEventStatus(status)) {
      fieldErrors.status = "Choose a valid event status.";
    } else {
      parsedStatus = status;
    }

    if (!identityMode) {
      fieldErrors.identity_mode = "Participant identity mode is required.";
    } else if (!isIdentityMode(identityMode)) {
      fieldErrors.identity_mode = "Choose a valid participant identity mode.";
    } else {
      parsedIdentityMode = identityMode;
    }

    if (moderationEnabled === null) {
      fieldErrors.moderation_enabled = "Moderation setting is required.";
    }

    if (
      Object.keys(fieldErrors).length > 0 ||
      !parsedStatus ||
      !parsedIdentityMode ||
      moderationEnabled === null
    ) {
      return { success: false, fieldErrors };
    }

    return {
      success: true,
      data: {
        name,
        starts_at: new Date(startsAt).toISOString(),
        time_zone: timeZone,
        status: parsedStatus,
        identity_mode: parsedIdentityMode,
        moderation_enabled: moderationEnabled,
        question_character_limit: DEFAULT_QUESTION_CHARACTER_LIMIT,
        duplicate_block_enabled: true,
        question_rate_limit_seconds: DEFAULT_QUESTION_RATE_LIMIT_SECONDS,
        organiserEmail: String(getValue(input, "organiserEmail") || "").trim() || undefined,
      },
    };
  },
};
