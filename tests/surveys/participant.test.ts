import { beforeEach, describe, expect, it, vi } from "vitest";

import { submitSurveyAction } from "@/app/join/[joinCode]/surveys/submit-actions";
import {
  loadParticipantSurvey,
  submitParticipantSurvey,
} from "@/lib/surveys/participant";

const cookiesGetMock = vi.hoisted(() => vi.fn());
const revalidatePathMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());
const rpcMock = vi.hoisted(() => vi.fn());
const validateParticipantSessionMock = vi.hoisted(() => vi.fn());
const getParticipantCookieNameMock = vi.hoisted(() =>
  vi.fn((eventId: string) => `qsb_ask_participant_${eventId}`),
);

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
    rpc: rpcMock,
  })),
}));

const surveyFixture = {
  created_at: "2026-05-30T00:00:00.000Z",
  created_by: "organiser-1",
  event_id: "event-1",
  id: "survey-1",
  results_visible_to_participants: false,
  status: "published",
  title: "Pulse check",
  updated_at: "2026-05-30T00:00:00.000Z",
  survey_questions: [
    {
      created_at: "2026-05-30T00:00:00.000Z",
      id: "question-choice",
      position: 0,
      prompt: "Is the pace clear?",
      rating_scale: null,
      survey_id: "survey-1",
      type: "multiple_choice",
      survey_options: [
        { id: "option-yes", label: "Yes", position: 0, survey_question_id: "question-choice" },
        { id: "option-no", label: "No", position: 1, survey_question_id: "question-choice" },
      ],
    },
    {
      created_at: "2026-05-30T00:00:00.000Z",
      id: "question-select",
      position: 1,
      prompt: "Which topics should we expand?",
      rating_scale: null,
      survey_id: "survey-1",
      type: "multiple_select",
      survey_options: [
        { id: "option-budget", label: "Budget", position: 0, survey_question_id: "question-select" },
        { id: "option-risks", label: "Risks", position: 1, survey_question_id: "question-select" },
      ],
    },
    {
      created_at: "2026-05-30T00:00:00.000Z",
      id: "question-rating",
      position: 2,
      prompt: "Rate the session",
      rating_scale: 5,
      survey_id: "survey-1",
      type: "rating",
      survey_options: [],
    },
    {
      created_at: "2026-05-30T00:00:00.000Z",
      id: "question-text",
      position: 3,
      prompt: "What should we clarify next?",
      rating_scale: null,
      survey_id: "survey-1",
      type: "open_text",
      survey_options: [],
    },
  ],
};

function form(values: Record<string, string | string[]>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) {
      for (const item of value) formData.append(key, item);
    } else {
      formData.set(key, value);
    }
  }

  return formData;
}

function surveyQuery(row: typeof surveyFixture | null = surveyFixture, responseRows: unknown[] = []) {
  function surveysQuery() {
    const query = {
      eq: vi.fn(() => query),
      order: vi.fn(() => query),
      limit: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: row, error: null })),
      single: vi.fn(async () => ({ data: row, error: row ? null : { message: "No rows" } })),
    };

    return {
      select: vi.fn(() => query),
    };
  }

  function surveyResponsesQuery() {
    const query = {
      eq: vi.fn(() => query),
      limit: vi.fn(async () => ({ data: responseRows, error: null })),
    };

    return {
      select: vi.fn(() => query),
    };
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "surveys") return surveysQuery();
    if (table === "survey_responses") return surveyResponsesQuery();
    throw new Error(`Unexpected table: ${table}`);
  });
}

const validAnswers = [
  { questionId: "question-choice", selectedOptionIds: ["option-yes"] },
  { questionId: "question-select", selectedOptionIds: ["option-budget", "option-risks"] },
  { questionId: "question-rating", ratingValue: 4 },
  { questionId: "question-text", textValue: "More detail on timeline." },
];

describe("participant survey helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    validateParticipantSessionMock.mockResolvedValue({
      event_id: "event-1",
      id: "participant-session-1",
    });
    rpcMock.mockResolvedValue({
      data: [{ already_submitted: false, response_id: "response-1" }],
      error: null,
    });
    surveyQuery();
  });

  it("validates the event-scoped participant token before loading or submitting a survey", async () => {
    await loadParticipantSurvey("event-1", "raw-token");
    await submitParticipantSurvey("event-1", "raw-token", "survey-1", validAnswers);

    expect(validateParticipantSessionMock).toHaveBeenNthCalledWith(1, "event-1", "raw-token");
    expect(validateParticipantSessionMock).toHaveBeenNthCalledWith(2, "event-1", "raw-token");
    expect(rpcMock).toHaveBeenCalledWith("submit_survey_response", {
      target_answers: expect.any(Array),
      target_participant_session_id: "participant-session-1",
      target_survey_id: "survey-1",
    });
  });

  it("returns answer controls only for published surveys and unavailable states for draft or closed surveys", async () => {
    surveyQuery({ ...surveyFixture, status: "published" });
    await expect(loadParticipantSurvey("event-1", "raw-token")).resolves.toMatchObject({
      state: "available",
      survey: {
        questions: expect.arrayContaining([
          expect.objectContaining({ prompt: "Is the pace clear?", type: "multiple_choice" }),
        ]),
        title: "Pulse check",
      },
    });

    surveyQuery({ ...surveyFixture, status: "draft" });
    await expect(loadParticipantSurvey("event-1", "raw-token")).resolves.toMatchObject({
      state: "unavailable",
      message: "No surveys are open",
    });

    surveyQuery({ ...surveyFixture, status: "closed" });
    await expect(loadParticipantSurvey("event-1", "raw-token")).resolves.toMatchObject({
      state: "closed",
      message: "This survey is closed. New responses are no longer being accepted.",
    });
  });

  it("enforces one response per participant session and maps duplicates to already-submitted copy", async () => {
    rpcMock.mockResolvedValueOnce({
      data: [{ already_submitted: true, response_id: null }],
      error: null,
    });

    await expect(
      submitParticipantSurvey("event-1", "raw-token", "survey-1", validAnswers),
    ).rejects.toThrow("You have already submitted this survey.");
  });

  it("hides participant results unless organiser visibility is enabled", async () => {
    surveyQuery({ ...surveyFixture, results_visible_to_participants: false }, [
      { id: "response-1", survey_id: "survey-1", participant_session_id: "participant-session-1" },
    ]);
    await expect(loadParticipantSurvey("event-1", "raw-token")).resolves.toMatchObject({
      completed: true,
      results: { visible: false },
    });

    surveyQuery({ ...surveyFixture, results_visible_to_participants: true }, [
      { id: "response-1", survey_id: "survey-1", participant_session_id: "participant-session-1" },
    ]);
    await expect(loadParticipantSurvey("event-1", "raw-token")).resolves.toMatchObject({
      completed: true,
      results: { visible: true },
    });
  });

  it("reads the raw token from the participant cookie and never trusts participant_session_id form data", async () => {
    cookiesGetMock.mockReturnValue({ value: "raw-cookie-token" });

    const result = await submitSurveyAction(
      "event-1",
      "QSB2X9ZA",
      form({
        participant_session_id: "attacker-controlled",
        surveyId: "survey-1",
        "answers.question-choice": "option-yes",
        "answers.question-select": ["option-budget", "option-risks"],
        "answers.question-rating.rating": "4",
        "answers.question-text.text": "More detail on timeline.",
      }),
    );

    expect(result.ok).toBe(true);
    expect(getParticipantCookieNameMock).toHaveBeenCalledWith("event-1");
    expect(validateParticipantSessionMock).toHaveBeenCalledWith("event-1", "raw-cookie-token");
    expect(rpcMock).toHaveBeenCalledWith(
      "submit_survey_response",
      expect.objectContaining({ target_participant_session_id: "participant-session-1" }),
    );
    expect(rpcMock).not.toHaveBeenCalledWith(
      "submit_survey_response",
      expect.objectContaining({ target_participant_session_id: "attacker-controlled" }),
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/join/QSB2X9ZA/surveys");
  });
});
