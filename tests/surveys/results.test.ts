import { beforeEach, describe, expect, it, vi } from "vitest";

import { SurveyBarChart } from "@/components/surveys/SurveyBarChart";
import {
  getOrganiserSurveyResults,
  getParticipantVisibleSurveyResults,
} from "@/lib/surveys/results";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";

const assertEventRoleMock = vi.hoisted(() => vi.fn());
const validateParticipantSessionMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("recharts", () => {
  const passthrough = ({ children }: { children?: unknown }) => children ?? null;

  return {
    Bar: passthrough,
    BarChart: passthrough,
    CartesianGrid: () => null,
    LabelList: () => null,
    ResponsiveContainer: passthrough,
    Tooltip: () => null,
    XAxis: () => null,
    YAxis: () => null,
  };
});

vi.mock("@/lib/events/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events/access")>("@/lib/events/access");

  return {
    ...actual,
    assertEventRole: assertEventRoleMock,
  };
});

vi.mock("@/lib/participants/session", async () => {
  const actual = await vi.importActual<typeof import("@/lib/participants/session")>(
    "@/lib/participants/session",
  );

  return {
    ...actual,
    validateParticipantSession: validateParticipantSessionMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

const surveyRows = [
  {
    created_at: "2026-05-30T00:00:00.000Z",
    created_by: "organiser-1",
    event_id: "event-1",
    id: "survey-1",
    results_visible_to_participants: true,
    status: "published",
    title: "Pulse check",
    updated_at: "2026-05-30T00:10:00.000Z",
    survey_questions: [
      {
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
        id: "question-rating",
        position: 2,
        prompt: "Rate the session",
        rating_scale: 5,
        survey_id: "survey-1",
        type: "rating",
        survey_options: [],
      },
      {
        id: "question-text",
        position: 3,
        prompt: "What should we clarify next?",
        rating_scale: null,
        survey_id: "survey-1",
        type: "open_text",
        survey_options: [],
      },
      {
        id: "question-zero",
        position: 4,
        prompt: "Should we repeat this format?",
        rating_scale: null,
        survey_id: "survey-1",
        type: "multiple_choice",
        survey_options: [
          { id: "option-agree", label: "Agree", position: 0, survey_question_id: "question-zero" },
          { id: "option-disagree", label: "Disagree", position: 1, survey_question_id: "question-zero" },
        ],
      },
    ],
  },
];

const responseRows = [
  {
    id: "response-1",
    participant_session_id: "participant-1",
    submitted_at: "2026-05-30T00:11:00.000Z",
    survey_id: "survey-1",
  },
  {
    id: "response-2",
    participant_session_id: "participant-2",
    submitted_at: "2026-05-30T00:12:00.000Z",
    survey_id: "survey-1",
  },
  {
    id: "response-3",
    participant_session_id: "participant-3",
    submitted_at: "2026-05-30T00:13:00.000Z",
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
    survey_responses: responseRows[0],
  },
  {
    id: "answer-2",
    rating_value: null,
    selected_option_ids: ["option-no"],
    survey_question_id: "question-choice",
    survey_response_id: "response-2",
    text_value: null,
    survey_responses: responseRows[1],
  },
  {
    id: "answer-3",
    rating_value: null,
    selected_option_ids: ["option-yes"],
    survey_question_id: "question-choice",
    survey_response_id: "response-3",
    text_value: null,
    survey_responses: responseRows[2],
  },
  {
    id: "answer-4",
    rating_value: null,
    selected_option_ids: ["option-budget", "option-risks"],
    survey_question_id: "question-select",
    survey_response_id: "response-1",
    text_value: null,
    survey_responses: responseRows[0],
  },
  {
    id: "answer-5",
    rating_value: null,
    selected_option_ids: ["option-risks"],
    survey_question_id: "question-select",
    survey_response_id: "response-2",
    text_value: null,
    survey_responses: responseRows[1],
  },
  {
    id: "answer-6",
    rating_value: 5,
    selected_option_ids: null,
    survey_question_id: "question-rating",
    survey_response_id: "response-1",
    text_value: null,
    survey_responses: responseRows[0],
  },
  {
    id: "answer-7",
    rating_value: 4,
    selected_option_ids: null,
    survey_question_id: "question-rating",
    survey_response_id: "response-2",
    text_value: null,
    survey_responses: responseRows[1],
  },
  {
    id: "answer-8",
    rating_value: 4,
    selected_option_ids: null,
    survey_question_id: "question-rating",
    survey_response_id: "response-3",
    text_value: null,
    survey_responses: responseRows[2],
  },
  {
    id: "answer-9",
    rating_value: null,
    selected_option_ids: null,
    survey_question_id: "question-text",
    survey_response_id: "response-1",
    text_value: "Need more budget detail.",
    survey_responses: responseRows[0],
  },
  {
    id: "answer-10",
    rating_value: null,
    selected_option_ids: null,
    survey_question_id: "question-text",
    survey_response_id: "response-2",
    text_value: "Timeline please.",
    survey_responses: responseRows[1],
  },
];

function queryResult<T>(data: T) {
  const query = {
    eq: vi.fn(() => query),
    in: vi.fn(() => query),
    order: vi.fn(() => query),
    select: vi.fn(() => query),
    then: (resolve: (value: { data: T; error: null }) => void) => resolve({ data, error: null }),
  };

  return query;
}

function mockResultQueries({
  surveys = surveyRows,
  responses = responseRows,
  answers = answerRows,
} = {}) {
  fromMock.mockImplementation((table: string) => {
    if (table === "surveys") return { select: vi.fn(() => queryResult(surveys)) };
    if (table === "survey_responses") return { select: vi.fn(() => queryResult(responses)) };
    if (table === "survey_answers") return { select: vi.fn(() => queryResult(answers)) };
    throw new Error(`Unexpected table: ${table}`);
  });
}

describe("survey result aggregation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue({ role: "organiser" });
    validateParticipantSessionMock.mockResolvedValue({ event_id: "event-1", id: "participant-1" });
    mockResultQueries();
  });

  it("requires organiser access and returns survey and per-question response counts", async () => {
    const results = await getOrganiserSurveyResults("organiser-1", "event-1");

    expect(assertEventRoleMock).toHaveBeenCalledWith("organiser-1", "event-1", EVENT_MANAGEMENT_ROLES);
    expect(results[0]).toMatchObject({
      id: "survey-1",
      responseCount: 3,
      title: "Pulse check",
    });
    expect(results[0].questions.map((question) => [question.id, question.responseCount])).toEqual([
      ["question-choice", 3],
      ["question-select", 2],
      ["question-rating", 3],
      ["question-text", 2],
      ["question-zero", 0],
    ]);
  });

  it("aggregates choice, multiple-select, and rating chart DTOs with labels, counts, and percentages", async () => {
    const [result] = await getOrganiserSurveyResults("organiser-1", "event-1");

    expect(result.questions.find((question) => question.id === "question-choice")?.chartData).toEqual([
      { count: 2, label: "Yes", percentage: 67 },
      { count: 1, label: "No", percentage: 33 },
    ]);
    expect(result.questions.find((question) => question.id === "question-select")?.chartData).toEqual([
      { count: 1, label: "Budget", percentage: 50 },
      { count: 2, label: "Risks", percentage: 100 },
    ]);
    expect(result.questions.find((question) => question.id === "question-rating")?.chartData).toContainEqual({
      count: 2,
      label: "4",
      percentage: 67,
    });
  });

  it("returns staff-only open text rows without token hashes, raw tokens, or participant emails", async () => {
    const [result] = await getOrganiserSurveyResults("organiser-1", "event-1");
    const textQuestion = result.questions.find((question) => question.id === "question-text");

    expect(textQuestion?.openTextResponses).toEqual([
      {
        label: "Response 1",
        submittedAt: "2026-05-30T00:11:00.000Z",
        text: "Need more budget detail.",
      },
      {
        label: "Response 2",
        submittedAt: "2026-05-30T00:12:00.000Z",
        text: "Timeline please.",
      },
    ]);
    expect(JSON.stringify(textQuestion?.openTextResponses)).not.toMatch(
      /token|token_hash|raw-cookie-token|@qsb/i,
    );
  });

  it("exposes participant-visible aggregate results only when visibility is enabled", async () => {
    await expect(getParticipantVisibleSurveyResults("event-1", "raw-token")).resolves.toHaveLength(1);

    mockResultQueries({
      surveys: [{ ...surveyRows[0], results_visible_to_participants: false }],
      responses: responseRows,
      answers: answerRows,
    });

    await expect(getParticipantVisibleSurveyResults("event-1", "raw-token")).resolves.toEqual([]);
    expect(validateParticipantSessionMock).toHaveBeenCalledWith("event-1", "raw-token");
  });
});

describe("SurveyBarChart", () => {
  it("renders readable labels, values, percentages, and an adjacent data table alternative", () => {
    const element = SurveyBarChart({
      data: [
        { count: 2, label: "Yes", percentage: 67 },
        { count: 1, label: "No", percentage: 33 },
      ],
      title: "Is the pace clear?",
    });
    const tree = JSON.stringify(element);

    expect(tree).toContain("Is the pace clear?");
    expect(tree).toContain("Yes");
    expect(tree).toContain("2 responses");
    expect(tree).toContain("67%");
    expect(tree).toContain("table");
  });

  it("preserves chart and table structure for zero-response surveys", () => {
    const element = SurveyBarChart({
      data: [
        { count: 0, label: "Agree", percentage: 0 },
        { count: 0, label: "Disagree", percentage: 0 },
      ],
      title: "Should we repeat this format?",
    });
    const tree = JSON.stringify(element);

    expect(tree).toContain("No responses yet");
    expect(tree).toContain("Charts will update when participants submit this survey.");
    expect(tree).toContain("Agree");
    expect(tree).toContain("0%");
    expect(tree).toContain("table");
  });
});
