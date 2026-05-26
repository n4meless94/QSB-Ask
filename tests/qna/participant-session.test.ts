import { beforeEach, describe, expect, it, vi } from "vitest";

import { joinParticipantAction } from "@/app/join/actions";
import {
  getParticipantCookieName,
  joinParticipantEvent,
  validateParticipantSession,
} from "@/lib/participants/session";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
);
const cookiesSetMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(() => undefined),
    getAll: vi.fn(() => []),
    set: cookiesSetMock,
  })),
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

type EventFixture = {
  id: string;
  identity_mode: "anonymous" | "name_required" | "name_email_required";
  join_code: string;
  name: string;
  status: "draft" | "active" | "ended" | "archived";
};

const activeEvent: EventFixture = {
  id: "event-1",
  identity_mode: "name_required",
  join_code: "QSB2X9ZA",
  name: "Quarterly Briefing",
  status: "active",
};

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function makeQueries(event: EventFixture | null = activeEvent) {
  const insertedRows: unknown[] = [];
  let storedHash = "";

  function eventsQuery() {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({
            data: event,
            error: event ? null : { message: "No rows" },
          })),
        })),
      })),
    };
  }

  function participantSessionsQuery() {
    return {
      insert: vi.fn((payload: { session_token_hash: string }) => {
        insertedRows.push(payload);
        storedHash = payload.session_token_hash;

        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                ...payload,
                id: "participant-session-1",
                event_id: event?.id ?? "event-1",
                created_at: "2026-05-26T00:00:00.000Z",
              },
              error: null,
            })),
          })),
        };
      }),
      select: vi.fn(() => ({
        eq: vi.fn((column: string, value: string) => ({
          eq: vi.fn(async () => ({
            data:
              column === "event_id" && value === "event-1"
                ? [
                    {
                      created_at: "2026-05-26T00:00:00.000Z",
                      display_name: "Jerry",
                      email: null,
                      event_id: "event-1",
                      id: "participant-session-1",
                      session_token_hash: storedHash,
                    },
                  ]
                : [],
            error: null,
          })),
        })),
      })),
    };
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "events") return eventsQuery();
    if (table === "participant_sessions") return participantSessionsQuery();
    throw new Error(`Unexpected table: ${table}`);
  });

  return { insertedRows };
}

describe("participant session helpers", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.APP_JOIN_URL_BASE = "http://localhost:3000/join";
    process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
    vi.clearAllMocks();
  });

  it("joins active events by code and stores only a token hash", async () => {
    const queries = makeQueries();

    const result = await joinParticipantEvent("qsb2x9za", {
      display_name: " Jerry ",
      email: "",
    });

    expect(result.event.name).toBe("Quarterly Briefing");
    expect(result.rawToken).toHaveLength(64);
    expect(queries.insertedRows[0]).toMatchObject({
      display_name: "Jerry",
      email: null,
      event_id: "event-1",
    });
    expect(JSON.stringify(queries.insertedRows[0])).not.toContain(result.rawToken);
    expect(JSON.stringify(queries.insertedRows[0])).toContain("session_token_hash");
    expect(getParticipantCookieName("event-1")).toBe("qsb_ask_participant_event-1");
  });

  it("rejects inactive or unknown events and enforces identity mode fields", async () => {
    makeQueries({ ...activeEvent, status: "draft" });

    await expect(joinParticipantEvent("QSB2X9ZA", { display_name: "Jerry" })).rejects.toThrow(
      "This event is not open for joining.",
    );

    makeQueries({ ...activeEvent, identity_mode: "name_email_required", status: "active" });

    await expect(joinParticipantEvent("QSB2X9ZA", { display_name: "Jerry" })).rejects.toThrow(
      "Email is required for this event.",
    );

    makeQueries({ ...activeEvent, identity_mode: "anonymous", status: "active" });

    await expect(joinParticipantEvent("QSB2X9ZA", {})).resolves.toMatchObject({
      participantSession: { event_id: "event-1" },
    });
  });

  it("validates participant sessions by event id and raw token possession", async () => {
    makeQueries();
    const joined = await joinParticipantEvent("QSB2X9ZA", { display_name: "Jerry" });

    await expect(validateParticipantSession("event-1", joined.rawToken)).resolves.toMatchObject({
      id: "participant-session-1",
    });
    await expect(validateParticipantSession("event-1", "wrong-token")).rejects.toThrow(
      "Participant session is invalid.",
    );
  });
});

describe("join participant action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    makeQueries();
  });

  it("sets an HTTP-only SameSite=Lax event-scoped cookie and redirects to event Q&A", async () => {
    await expect(
      joinParticipantAction(form({ join_code: "QSB2X9ZA", display_name: "Jerry" })),
    ).rejects.toThrow("REDIRECT:/join/QSB2X9ZA/qna");

    expect(cookiesSetMock).toHaveBeenCalledWith(
      "qsb_ask_participant_event-1",
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
      }),
    );
  });
});
