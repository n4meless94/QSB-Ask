import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  closeSurvey,
  createSurvey,
  listSurveysForOrganiser,
  publishSurvey,
  saveSurveyDraft,
  saveSurveyVisibility,
} from "@/lib/surveys/management";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";

const assertEventRoleMock = vi.hoisted(() => vi.fn());
const fromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@/lib/events/access", async () => {
  const actual = await vi.importActual<typeof import("@/lib/events/access")>("@/lib/events/access");

  return {
    ...actual,
    assertEventRole: assertEventRoleMock,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    from: fromMock,
  })),
}));

const accessFixture = {
  event: {
    id: "event-1",
    name: "Quarterly Briefing",
  },
  membership: {
    id: "member-1",
    role: "organiser",
  },
  role: "organiser",
};

const surveyFixture = {
  created_at: "2026-05-30T00:00:00.000Z",
  created_by: "organiser-1",
  event_id: "event-1",
  id: "survey-1",
  results_visible_to_participants: false,
  status: "draft",
  title: "Pulse check",
  updated_at: "2026-05-30T00:00:00.000Z",
};

function draftInput(overrides: Partial<Parameters<typeof saveSurveyDraft>[2]> = {}) {
  return {
    questions: [
      {
        options: ["Yes", "No"],
        prompt: "Is the pace clear?",
        type: "multiple_choice" as const,
      },
      {
        options: ["Budget", "Timeline", "Risks"],
        prompt: "Which topics should we expand?",
        type: "multiple_select" as const,
      },
      {
        prompt: "Rate the session",
        ratingScale: 5 as const,
        type: "rating" as const,
      },
      {
        prompt: "What should we clarify next?",
        type: "open_text" as const,
      },
    ],
    surveyId: "survey-1",
    title: "Pulse check",
    ...overrides,
  };
}

function surveySelectQuery() {
  const query = {
    eq: vi.fn(() => query),
    order: vi.fn(async () => ({
      data: [
        {
          ...surveyFixture,
          survey_questions: [
            {
              id: "question-1",
              position: 0,
              prompt: "Is the pace clear?",
              rating_scale: null,
              survey_options: [
                { id: "option-1", label: "Yes", position: 0 },
                { id: "option-2", label: "No", position: 1 },
              ],
              type: "multiple_choice",
            },
          ],
        },
      ],
      error: null,
    })),
    single: vi.fn(async () => ({
      data: {
        ...surveyFixture,
        survey_questions: [
          {
            id: "question-1",
            position: 0,
            prompt: "Is the pace clear?",
            rating_scale: null,
            survey_options: [
              { id: "option-1", label: "Yes", position: 0 },
              { id: "option-2", label: "No", position: 1 },
            ],
            type: "multiple_choice",
          },
        ],
      },
      error: null,
    })),
  };

  return {
    eq: vi.fn(() => query),
  };
}

function makeQueries() {
  const insertedSurveys: unknown[] = [];
  const updatedSurveys: unknown[] = [];
  const insertedQuestions: unknown[] = [];
  const insertedOptions: unknown[] = [];
  const deletedSurveyQuestions: unknown[] = [];
  const selectedSurveyIds: string[] = [];

  function surveysQuery() {
    return {
      insert: vi.fn((payload: unknown) => {
        insertedSurveys.push(payload);

        return {
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: surveyFixture, error: null })),
          })),
        };
      }),
      select: vi.fn(() => surveySelectQuery()),
      update: vi.fn((payload: Record<string, unknown>) => {
        updatedSurveys.push(payload);

        const query = {
          eq: vi.fn((column: string, value: string) => {
            if (column === "id") selectedSurveyIds.push(value);
            return query;
          }),
          select: vi.fn(() => ({
            single: vi.fn(async () => ({ data: { ...surveyFixture, ...payload }, error: null })),
          })),
        };

        return query;
      }),
    };
  }

  function surveyQuestionsQuery() {
    const deleteQuery = {
      eq: vi.fn((column: string, value: string) => {
        deletedSurveyQuestions.push({ column, value });
        return Promise.resolve({ error: null });
      }),
    };

    return {
      delete: vi.fn(() => deleteQuery),
      insert: vi.fn((payload: unknown) => {
        insertedQuestions.push(payload);

        return {
          select: vi.fn(() => ({
            order: vi.fn(async () => ({
              data: [
                { id: "question-1", position: 0 },
                { id: "question-2", position: 1 },
                { id: "question-3", position: 2 },
                { id: "question-4", position: 3 },
              ],
              error: null,
            })),
          })),
        };
      }),
    };
  }

  function surveyOptionsQuery() {
    return {
      insert: vi.fn(async (payload: unknown) => {
        insertedOptions.push(payload);
        return { error: null };
      }),
    };
  }

  fromMock.mockImplementation((table: string) => {
    if (table === "surveys") return surveysQuery();
    if (table === "survey_questions") return surveyQuestionsQuery();
    if (table === "survey_options") return surveyOptionsQuery();
    throw new Error(`Unexpected table: ${table}`);
  });

  return { deletedSurveyQuestions, insertedOptions, insertedQuestions, insertedSurveys, selectedSurveyIds, updatedSurveys };
}

describe("organiser survey management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    assertEventRoleMock.mockResolvedValue(accessFixture);
  });

  it("requires organiser access before listing, creating, saving, publishing, closing, or changing visibility", async () => {
    makeQueries();

    await listSurveysForOrganiser("organiser-1", "event-1");
    await createSurvey("organiser-1", "event-1", "Pulse check");
    await saveSurveyDraft("organiser-1", "event-1", draftInput());
    await publishSurvey("organiser-1", "event-1", "survey-1");
    await closeSurvey("organiser-1", "event-1", "survey-1");
    await saveSurveyVisibility("organiser-1", "event-1", "survey-1", true);

    expect(assertEventRoleMock).toHaveBeenCalledTimes(6);
    for (const call of assertEventRoleMock.mock.calls) {
      expect(call).toEqual(["organiser-1", "event-1", EVENT_MANAGEMENT_ROLES]);
    }

    const callsBeforeDeniedAccess = fromMock.mock.calls.length;
    assertEventRoleMock.mockRejectedValueOnce(new Error("You do not have organiser access to this event."));
    await expect(listSurveysForOrganiser("moderator-1", "event-1")).rejects.toThrow(
      "You do not have organiser access to this event.",
    );
    expect(fromMock).toHaveBeenCalledTimes(callsBeforeDeniedAccess);
  });

  it("creates draft surveys with participant result visibility hidden by default", async () => {
    const queries = makeQueries();

    const survey = await createSurvey("organiser-1", "event-1", " Pulse check ");

    expect(queries.insertedSurveys[0]).toMatchObject({
      created_by: "organiser-1",
      event_id: "event-1",
      results_visible_to_participants: false,
      status: "draft",
      title: "Pulse check",
    });
    expect(survey.results_visible_to_participants).toBe(false);
  });

  it("saves approved question types, prompts, positions, option labels, and rating scales", async () => {
    const queries = makeQueries();

    await saveSurveyDraft("organiser-1", "event-1", draftInput());

    expect(queries.updatedSurveys[0]).toMatchObject({ title: "Pulse check" });
    expect(queries.deletedSurveyQuestions[0]).toEqual({ column: "survey_id", value: "survey-1" });
    expect(queries.insertedQuestions[0]).toEqual([
      {
        position: 0,
        prompt: "Is the pace clear?",
        rating_scale: null,
        survey_id: "survey-1",
        type: "multiple_choice",
      },
      {
        position: 1,
        prompt: "Which topics should we expand?",
        rating_scale: null,
        survey_id: "survey-1",
        type: "multiple_select",
      },
      {
        position: 2,
        prompt: "Rate the session",
        rating_scale: 5,
        survey_id: "survey-1",
        type: "rating",
      },
      {
        position: 3,
        prompt: "What should we clarify next?",
        rating_scale: null,
        survey_id: "survey-1",
        type: "open_text",
      },
    ]);
    expect(queries.insertedOptions[0]).toEqual([
      { label: "Yes", position: 0, survey_question_id: "question-1" },
      { label: "No", position: 1, survey_question_id: "question-1" },
      { label: "Budget", position: 0, survey_question_id: "question-2" },
      { label: "Timeline", position: 1, survey_question_id: "question-2" },
      { label: "Risks", position: 2, survey_question_id: "question-2" },
    ]);
  });

  it("returns publish validation errors without changing status when a survey is incomplete", async () => {
    makeQueries();

    const result = await publishSurvey("organiser-1", "event-1", "survey-1", {
      questions: [
        { options: ["Yes", ""], prompt: "", type: "multiple_choice" },
        { prompt: "Rate it", ratingScale: 7, type: "rating" },
      ],
      surveyId: "survey-1",
      title: " ",
    });

    expect(result).toMatchObject({
      errors: {
        questions: expect.arrayContaining([
          "Survey title is required.",
          "Question 1 prompt is required.",
          "Question 1 needs at least two answer options.",
          "Question 2 rating scale must be 5 or 10.",
        ]),
      },
      ok: false,
    });
    expect(fromMock).not.toHaveBeenCalledWith("surveys");
  });

  it("publishes valid surveys, closes published surveys, and saves organiser-controlled result visibility", async () => {
    const queries = makeQueries();

    await publishSurvey("organiser-1", "event-1", "survey-1", draftInput());
    await closeSurvey("organiser-1", "event-1", "survey-1");
    await saveSurveyVisibility("organiser-1", "event-1", "survey-1", true);

    expect(queries.selectedSurveyIds).toContain("survey-1");
    expect(queries.updatedSurveys).toEqual([
      { title: "Pulse check" },
      { status: "published" },
      { status: "closed" },
      { results_visible_to_participants: true },
    ]);
  });
});
