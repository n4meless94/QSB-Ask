import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitQuestionAction } from "@/app/join/[joinCode]/qna/submit-actions";
import { listPublicQuestions } from "@/lib/qna/public";
import { submitParticipantQuestion } from "@/lib/qna/submission";
import { PUBLIC_QUESTION_STATUSES } from "@/lib/supabase/rls";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const validateParticipantSessionMock = vi.hoisted(() => vi.fn());
const getParticipantCookieNameMock = vi.hoisted(() => vi.fn((eventId: string) => `qsb_ask_participant_${eventId}`));

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: revalidatePathMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: cookiesGetMock,
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock("@/lib/participants/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/participants/session")>(
    "@/lib/participants/session",
  );

  return {
    ...actual,
    getParticipantCookieName: getParticipantCookieNameMock,
    validateParticipantSession: validateParticipantSessionMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: fromMock,
  })),
}));

const eventFixture = {
  duplicate_block_enabled: true,
  id: "event-1",
  moderation_enabled: true,
  name: "Quarterly Briefing",
  question_character_limit: 280,
  question_rate_limit_seconds: 30,
  status: "active",
};

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function makeQueries({
  event = eventFixture,
  existingQuestions = [],
}: {
  event?: typeof eventFixture | null;
  existingQuestions?: Array<{ current_text: string; submitted_at: string }>;
} = {}) {
  const insertedQuestions: unknown[] = [];
  const insertedVersions: unknown[] = [];
  const publicStatusFilters: unknown[] = [];

  function eventsQuery() {
    return {
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => ({ data: event, error: event ? null : { message: "No rows" } })),
        })),
      })),
    };
  }

  function questionsQuery() {
    return {
      insert: vi.fn((payload: unknown) => {
        insertedQuestions.push(payload);

        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({
              data: {
                id: "question-1",
                current_text: "Will slides be shared?",
                event_id: "event-1",
                is_edited: false,
                participant_session_id: "participant-session-1",
                status: "pending",
                submitted_at: "2026-05-26T00:00:00.000Z",
                updated_at: "2026-05-26T00:00:00.000Z",
                vote_count: 0,
              },
              error: null,
            })),
          })),
        };
      }),
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            order: vi.fn(async () => ({ data: existingQuestions, error: null })),
          })),
          in: vi.fn((column: string, values: unknown[]) => {
            publicStatusFilters.push({ column, values });
            return {
              order: vi.fn(async () => ({
                data: [
                  {
                    id: "question-live",
                    current_text: "Approved question",
                    status: "live",
                    vote_count: 2,
                    is_edited: false,
                    submitted_at: "2026-05-26T00:00:00.000Z",
                    updated_at: "2026-05-26T00:00:00.000Z",
                  },
                ],
                error: null,
              })),
            };
          }),
        })),
      })),
    };
  }

  function questionVersionsQuery() {
    return {
      insert: vi.fn(async (payload: unknown) => {
        insertedVersions.push(payload);
        return { error: null };
      }),
    };
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "events") return eventsQuery();
    if (table === "questions") return questionsQuery();
    if (table === "question_versions") return questionVersionsQuery();
    throw new Error(`Unexpected table: ${table}`);
  });

  return { insertedQuestions, insertedVersions, publicStatusFilters };
}

describe("participant question submission", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateParticipantSessionMock.mockResolvedValue({
      id: "participant-session-1",
      event_id: "event-1",
    });
  });

  it("creates pending moderated questions and version 1 without leaking to public reads", async () => {
    const queries = makeQueries();

    await submitParticipantQuestion("event-1", "raw-token", " Will slides be shared? ");

    expect(validateParticipantSessionMock).toHaveBeenCalledWith("event-1", "raw-token");
    expect(queries.insertedQuestions[0]).toMatchObject({
      current_text: "Will slides be shared?",
      event_id: "event-1",
      participant_session_id: "participant-session-1",
      status: "pending",
    });
    expect(queries.insertedVersions[0]).toMatchObject({
      question_id: "question-1",
      text: "Will slides be shared?",
      version_number: 1,
    });

    await listPublicQuestions("event-1");
    expect(queries.publicStatusFilters[0]).toEqual({
      column: "status",
      values: PUBLIC_QUESTION_STATUSES,
    });
  });

  it("uses live status only when moderation is disabled", async () => {
    const queries = makeQueries({ event: { ...eventFixture, moderation_enabled: false } });

    await submitParticipantQuestion("event-1", "raw-token", "Open floor now?");

    expect(queries.insertedQuestions[0]).toMatchObject({ status: "live" });
  });

  it("rejects invalid sessions, inactive events, too-long text, rate limit, and duplicate text", async () => {
    validateParticipantSessionMock.mockRejectedValueOnce(new Error("Participant session is invalid."));
    await expect(submitParticipantQuestion("event-1", "bad-token", "Hello?")).rejects.toThrow(
      "Participant session is invalid.",
    );

    validateParticipantSessionMock.mockResolvedValue({ id: "participant-session-1", event_id: "event-1" });
    makeQueries({ event: { ...eventFixture, status: "ended" } });
    await expect(submitParticipantQuestion("event-1", "raw-token", "Hello?")).rejects.toThrow(
      "This event is closed.",
    );

    makeQueries();
    await expect(submitParticipantQuestion("event-1", "raw-token", "x".repeat(281))).rejects.toThrow(
      "Question must be 280 characters or fewer.",
    );

    makeQueries({
      existingQuestions: [{ current_text: "Earlier", submitted_at: new Date().toISOString() }],
    });
    await expect(submitParticipantQuestion("event-1", "raw-token", "Another question")).rejects.toThrow(
      "Please wait before submitting another question.",
    );

    makeQueries({
      existingQuestions: [
        { current_text: "Will slides be shared?", submitted_at: "2020-01-01T00:00:00.000Z" },
      ],
    });
    await expect(
      submitParticipantQuestion("event-1", "raw-token", " will slides be shared? "),
    ).rejects.toThrow("This question looks like one you already submitted.");
  });
});

describe("submit question action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateParticipantSessionMock.mockResolvedValue({
      id: "participant-session-1",
      event_id: "event-1",
    });
    cookiesGetMock.mockReturnValue({ value: "raw-token" });
    makeQueries();
  });

  it("uses the participant cookie and returns waiting-for-review copy", async () => {
    const result = await submitQuestionAction("event-1", "QSB2X9ZA", form({ question: "Hello?" }));

    expect(getParticipantCookieNameMock).toHaveBeenCalledWith("event-1");
    expect(result).toMatchObject({
      ok: true,
      message: "Question submitted. It is waiting for moderator review.",
    });
    expect(revalidatePathMock).toHaveBeenCalledWith("/join/QSB2X9ZA/qna");
  });
});
