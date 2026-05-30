import { beforeEach, describe, expect, it, vi } from "vitest";

import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";

const assertEventRoleMock = vi.hoisted(() => vi.fn());
const createSupabaseServerClientMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const authGetUserMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/events/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events/access")>("@/lib/events/access");

  return {
    ...actual,
    assertEventRole: assertEventRoleMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: createSupabaseServerClientMock,
}));

function queryResult<T>(data: T) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve({ data, error: null })),
    then: (resolve: (value: { data: T; error: null }) => void) => resolve({ data, error: null }),
  };

  return query;
}

const participant = {
  display_name: null,
  email: null,
  id: "participant-session-abcdef123456",
  session_token_hash: "never-export-token-hash",
};

const questionRows = [
  {
    current_text: '=SUM("budget, risk")',
    event_id: "event-1",
    id: "question-1",
    is_edited: true,
    participant_session_id: participant.id,
    participant_sessions: participant,
    previous_status: "pending",
    status: "live",
    submitted_at: "2026-05-30T00:01:00.000Z",
    updated_at: "2026-05-30T00:03:00.000Z",
    vote_count: 2,
  },
];

const questionVersionRows = [
  {
    created_at: "2026-05-30T00:02:00.000Z",
    edited_by: "moderator-1",
    id: "version-1",
    question_id: "question-1",
    text: "Original question\nwith quote \"here\"",
    version_number: 1,
  },
];

const moderationRows = [
  {
    action: "approve",
    actor_user_id: "moderator-1",
    created_at: "2026-05-30T00:04:00.000Z",
    event_id: "event-1",
    from_status: "pending",
    id: "action-1",
    metadata: { reason: "+approved" },
    question_id: "question-1",
    to_status: "live",
  },
];

const surveyRows = [
  {
    created_at: "2026-05-30T00:00:00.000Z",
    created_by: "organiser-1",
    event_id: "event-1",
    id: "survey-1",
    results_visible_to_participants: false,
    status: "published",
    title: "Pulse check",
    updated_at: "2026-05-30T00:10:00.000Z",
    survey_questions: [
      {
        id: "question-choice",
        position: 0,
        prompt: "Choose one",
        rating_scale: null,
        survey_id: "survey-1",
        type: "multiple_choice",
        survey_options: [
          { id: "option-yes", label: "Yes", position: 0, survey_question_id: "question-choice" },
          { id: "option-no", label: "No", position: 1, survey_question_id: "question-choice" },
        ],
      },
      {
        id: "question-text",
        position: 1,
        prompt: "Comment",
        rating_scale: null,
        survey_id: "survey-1",
        type: "open_text",
        survey_options: [],
      },
    ],
  },
];

const responseRows = [
  {
    id: "response-1",
    participant_session_id: participant.id,
    participant_sessions: participant,
    submitted_at: "2026-05-30T00:11:00.000Z",
    survey_id: "survey-1",
  },
];

const answerRows = [
  {
    id: "answer-1",
    rating_value: null,
    selected_option_ids: ["option-yes"],
    survey_question_id: "question-choice",
    survey_response_id: "response-1",
    text_value: null,
  },
  {
    id: "answer-2",
    rating_value: null,
    selected_option_ids: null,
    survey_question_id: "question-text",
    survey_response_id: "response-1",
    text_value: "@Needs follow-up",
  },
];

function mockExportQueries({
  answers = answerRows,
  moderation = moderationRows,
  questions = questionRows,
  responses = responseRows,
  surveys = surveyRows,
  versions = questionVersionRows,
} = {}) {
  fromMock.mockImplementation((table: string) => {
    if (table === "questions") return { select: vi.fn(() => queryResult(questions)) };
    if (table === "question_versions") return { select: vi.fn(() => queryResult(versions)) };
    if (table === "moderation_actions") return { select: vi.fn(() => queryResult(moderation)) };
    if (table === "surveys") return { select: vi.fn(() => queryResult(surveys)) };
    if (table === "survey_responses") return { select: vi.fn(() => queryResult(responses)) };
    if (table === "survey_answers") return { select: vi.fn(() => queryResult(answers)) };
    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("CSV export helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue({ role: "organiser" });
    createSupabaseServerClientMock.mockResolvedValue({
      auth: { getUser: authGetUserMock },
      from: fromMock,
    });
    authGetUserMock.mockResolvedValue({ data: { user: { id: "organiser-1" } }, error: null });
    mockExportQueries();
  });

  it("exports questions and question versions with stable headers and hardened CSV cells", async () => {
    const { getExportCsv } = await import("@/lib/surveys/export");
    const payload = await getExportCsv("organiser-1", "event-1", "questions");

    expect(payload.headers).toEqual([
      "record_type",
      "question_id",
      "version_id",
      "participant_label",
      "status",
      "previous_status",
      "current_text",
      "version_number",
      "version_text",
      "submitted_at",
      "updated_at",
      "edited_by",
    ]);
    expect(payload.rows).toHaveLength(2);
    expect(payload.csv).toContain("'=SUM");
    expect(payload.csv).toContain('"Original question\nwith quote ""here"""');
    expect(payload.csv).toContain("Anonymous (session participant)");
  });

  it("exports moderation action history with actor, action, status, metadata, and timestamp headers", async () => {
    const { getExportCsv } = await import("@/lib/surveys/export");
    const payload = await getExportCsv("organiser-1", "event-1", "moderation");

    expect(payload.headers).toEqual([
      "action_id",
      "question_id",
      "actor_user_id",
      "action",
      "from_status",
      "to_status",
      "metadata",
      "created_at",
    ]);
    expect(payload.csv).toContain("moderator-1");
    expect(payload.csv).toContain('"{""reason"":""+approved""}"');
  });

  it("exports flattened survey responses with safe participant labels and no token material", async () => {
    const { getExportCsv } = await import("@/lib/surveys/export");
    const payload = await getExportCsv("organiser-1", "event-1", "survey-responses");

    expect(payload.headers).toEqual([
      "survey_id",
      "survey_title",
      "survey_status",
      "response_id",
      "participant_label",
      "submitted_at",
      "question_id",
      "question_prompt",
      "question_type",
      "answer",
    ]);
    expect(payload.rows).toHaveLength(2);
    expect(payload.csv).toContain("Pulse check");
    expect(payload.csv).toContain("'@Needs follow-up");
    expect(payload.csv).toContain("Anonymous (session participant)");
    expect(payload.csv).not.toMatch(/never-export-token-hash|raw-token|session_token_hash/i);
  });

  it("requires organiser access before export data is queried", async () => {
    const { getExportCsv } = await import("@/lib/surveys/export");

    await getExportCsv("organiser-1", "event-1", "questions");

    expect(assertEventRoleMock).toHaveBeenCalledWith("organiser-1", "event-1", EVENT_MANAGEMENT_ROLES);
    expect(fromMock).toHaveBeenCalledWith("questions");
    expect(assertEventRoleMock.mock.invocationCallOrder[0]).toBeLessThan(
      fromMock.mock.invocationCallOrder[0],
    );
  });

  it("returns empty export counts and a clear empty response instead of a blank CSV attachment", async () => {
    mockExportQueries({
      answers: [],
      moderation: [],
      questions: [],
      responses: [],
      surveys: [],
      versions: [],
    });
    const { getExportCsv, getOrganiserExportCounts } = await import("@/lib/surveys/export");
    const route = await import("@/app/(app)/events/[eventId]/export/[kind]/route");

    await expect(getOrganiserExportCounts("organiser-1", "event-1")).resolves.toEqual({
      moderation: 0,
      questions: 0,
      "survey-responses": 0,
    });

    const payload = await getExportCsv("organiser-1", "event-1", "questions");
    expect(payload.rows).toHaveLength(0);

    const response = await route.GET(new Request("http://127.0.0.1/events/event-1/export/questions"), {
      params: Promise.resolve({ eventId: "event-1", kind: "questions" }),
    });

    expect(response.status).toBe(204);
    expect(response.headers.get("content-disposition")).toBeNull();
    expect(response.headers.get("content-type") ?? "").not.toContain("text/csv");
  });
});
