import { beforeEach, describe, expect, it, vi } from "vitest";

import { createEventAction } from "@/app/(app)/events/actions";
import {
  buildJoinLink,
  createEventForOrganiser,
  listAccessibleEvents,
} from "@/lib/events/events";
import { createEventSchema } from "@/lib/events/validation";

const redirectMock = vi.hoisted(() =>
  vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
);

const getUserMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
  cookies: vi.fn(async () => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
  })),
}));

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function validEventFields(overrides: Record<string, string> = {}) {
  return {
    name: "Quarterly Briefing",
    starts_at: "2099-06-01T09:00",
    time_zone: "Asia/Kuala_Lumpur",
    status: "draft",
    identity_mode: "name_required",
    moderation_enabled: "true",
    ...overrides,
  };
}

function makeUsersQuery() {
  const upsert = vi.fn(async () => ({ error: null }));

  return { upsert };
}

function makeEventsInsertQuery() {
  const single = vi.fn(async () => ({
    data: {
      id: "event-1",
      name: "Quarterly Briefing",
      join_code: "QSB2X9ZA",
      starts_at: "2099-06-01T01:00:00.000Z",
      time_zone: "Asia/Kuala_Lumpur",
      status: "draft",
      identity_mode: "name_required",
      moderation_enabled: true,
      question_character_limit: 280,
      duplicate_block_enabled: true,
      question_rate_limit_seconds: 30,
      created_by: "user-1",
    },
    error: null,
  }));
  const select = vi.fn(() => ({ single }));
  const insert = vi.fn(() => ({ select }));

  return { insert, select, single };
}

function makeMembershipQuery() {
  const single = vi.fn(async () => ({
    data: { event_id: "event-1", user_id: "user-1", role: "organiser", status: "active" },
    error: null,
  }));
  const statusEq = vi.fn(() => ({ single }));
  const roleEq = vi.fn(() => ({ eq: statusEq }));
  const userEq = vi.fn(() => ({ eq: roleEq }));
  const eventEq = vi.fn(() => ({ eq: userEq }));
  const select = vi.fn(() => ({ eq: eventEq }));

  return { select, eventEq, userEq, roleEq, statusEq, single };
}

function makeEventListQuery() {
  const order = vi.fn(async () => ({
    data: [
      {
        events: {
          id: "event-1",
          name: "Quarterly Briefing",
          join_code: "QSB2X9ZA",
          starts_at: "2099-06-01T01:00:00.000Z",
          time_zone: "Asia/Kuala_Lumpur",
          status: "draft",
          identity_mode: "name_required",
          moderation_enabled: true,
          question_character_limit: 280,
          duplicate_block_enabled: true,
          question_rate_limit_seconds: 30,
          created_by: "user-1",
        },
      },
    ],
    error: null,
  }));
  const statusEq = vi.fn(() => ({ order }));
  const userEq = vi.fn(() => ({ eq: statusEq }));
  const select = vi.fn(() => ({ eq: userEq }));

  return { select, userEq, statusEq, order };
}

describe("event validation", () => {
  it("requires all Phase 1 event fields", () => {
    const result = createEventSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors).toMatchObject({
        name: "Event name is required.",
        starts_at: "Event date/time is required.",
        time_zone: "Time zone is required.",
        status: "Status is required.",
        identity_mode: "Participant identity mode is required.",
        moderation_enabled: "Moderation setting is required.",
      });
    }
  });

  it("rejects past event date/time", () => {
    const result = createEventSchema.safeParse(validEventFields({ starts_at: "2020-01-01T09:00" }));

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.fieldErrors.starts_at).toBe("Event date/time cannot be in the past.");
    }
  });
});

describe("event data access", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.APP_JOIN_URL_BASE = "http://localhost:3000/join";
    process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
    vi.clearAllMocks();
    getUserMock.mockResolvedValue({
      data: { user: { id: "user-1", email: "organiser@qsb.com" } },
      error: null,
    });
  });

  it("creates an event with defaults, a join code, and active organiser membership", async () => {
    const usersQuery = makeUsersQuery();
    const eventsQuery = makeEventsInsertQuery();
    const membershipQuery = makeMembershipQuery();

    fromMock.mockImplementation((table: string) => {
      if (table === "users") return usersQuery;
      if (table === "events") return eventsQuery;
      if (table === "event_members") return membershipQuery;
      throw new Error(`Unexpected table: ${table}`);
    });

    const result = await createEventForOrganiser("user-1", {
      ...validEventFields(),
      organiserEmail: "organiser@qsb.com",
    });

    expect(result.join_code).toMatch(/^[A-Z2-9]{8}$/);
    expect(eventsQuery.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        created_by: "user-1",
        moderation_enabled: true,
        question_character_limit: 280,
        duplicate_block_enabled: true,
        question_rate_limit_seconds: 30,
      }),
    );
    expect(membershipQuery.statusEq).toHaveBeenCalledWith("status", "active");
  });

  it("lists only events accessible to the signed-in user", async () => {
    const listQuery = makeEventListQuery();
    fromMock.mockReturnValue(listQuery);

    const result = await listAccessibleEvents("user-1");

    expect(fromMock).toHaveBeenCalledWith("event_members");
    expect(listQuery.userEq).toHaveBeenCalledWith("user_id", "user-1");
    expect(listQuery.statusEq).toHaveBeenCalledWith("status", "active");
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe("Quarterly Briefing");
  });

  it("builds join links from the configured join URL base", () => {
    process.env.APP_JOIN_URL_BASE = "https://ask.qsbportal.com.my/join";

    expect(buildJoinLink("QSB2X9ZA")).toBe("https://ask.qsbportal.com.my/join/QSB2X9ZA");
  });
});

describe("create event action", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.APP_JOIN_URL_BASE = "http://localhost:3000/join";
    process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
    vi.clearAllMocks();
  });

  it("returns field and summary errors for invalid form data", async () => {
    const result = await createEventAction(form({ name: "", starts_at: "2020-01-01T09:00" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toBe("Fix the highlighted fields and try again.");
      expect(result.fieldErrors.name).toBe("Event name is required.");
      expect(result.fieldErrors.starts_at).toBe("Event date/time cannot be in the past.");
    }
  });
});
