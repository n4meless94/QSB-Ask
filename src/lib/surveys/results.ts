import "server-only";

import { assertEventRole, getPresenterEventAccess, type EventAccessContext } from "@/lib/events/access";
import { validateParticipantSession } from "@/lib/participants/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";
import type { SurveyQuestionType, SurveyStatus } from "@/types/app";

type SurveyRow = Tables<"surveys">;
type SurveyQuestionRow = Tables<"survey_questions">;
type SurveyOptionRow = Tables<"survey_options">;
type SurveyResponseRow = Tables<"survey_responses">;
type SurveyAnswerRow = Tables<"survey_answers">;

type SurveyQuestionWithOptions = SurveyQuestionRow & {
  survey_options?: SurveyOptionRow[] | null;
};

type SurveyWithQuestions = SurveyRow & {
  survey_questions?: SurveyQuestionWithOptions[] | null;
};

type AnswerWithResponse = SurveyAnswerRow & {
  survey_responses?: Pick<SurveyResponseRow, "id" | "submitted_at" | "survey_id"> | null;
};

export type SurveyChartDatum = {
  count: number;
  label: string;
  percentage: number;
};

export type OpenTextResponse = {
  label: string;
  submittedAt: string;
  text: string;
};

export type SurveyQuestionResult = {
  chartData: SurveyChartDatum[];
  id: string;
  openTextResponses: OpenTextResponse[];
  options: Array<{ id: string; label: string; position: number }>;
  position: number;
  prompt: string;
  ratingScale: 5 | 10 | null;
  responseCount: number;
  type: SurveyQuestionType;
};

export type SurveyResult = {
  id: string;
  lastUpdated: string;
  presentationHref: string;
  questions: SurveyQuestionResult[];
  responseCount: number;
  resultsVisibleToParticipants: boolean;
  status: SurveyStatus;
  title: string;
};

export type PresentationSurveyResults = {
  access: EventAccessContext;
  result: SurveyResult;
};

const SURVEY_RESULT_SELECT =
  "id,event_id,title,status,results_visible_to_participants,created_at,updated_at,created_by,survey_questions(id,survey_id,type,prompt,position,rating_scale,created_at,survey_options(id,survey_question_id,label,position))";

function percent(count: number, total: number) {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

function responseLabel(index: number) {
  return `Response ${index + 1}`;
}

function sortByPosition<T extends { position: number }>(rows: T[] | null | undefined) {
  return [...(rows ?? [])].sort((left, right) => left.position - right.position);
}

function answerResponseId(answer: AnswerWithResponse) {
  return answer.survey_response_id;
}

function answerSubmittedAt(answer: AnswerWithResponse, responsesById: Map<string, SurveyResponseRow>) {
  return answer.survey_responses?.submitted_at ?? responsesById.get(answer.survey_response_id)?.submitted_at ?? "";
}

function answersForQuestion(questionId: string, answers: AnswerWithResponse[]) {
  return answers.filter((answer) => answer.survey_question_id === questionId);
}

function answeredResponseCount(question: SurveyQuestionWithOptions, answers: AnswerWithResponse[]) {
  const responseIds = new Set<string>();

  for (const answer of answersForQuestion(question.id, answers)) {
    if (question.type === "multiple_choice" || question.type === "multiple_select") {
      if ((answer.selected_option_ids ?? []).length > 0) responseIds.add(answerResponseId(answer));
    } else if (question.type === "rating") {
      if (typeof answer.rating_value === "number") responseIds.add(answerResponseId(answer));
    } else if ((answer.text_value ?? "").trim()) {
      responseIds.add(answerResponseId(answer));
    }
  }

  return responseIds.size;
}

function choiceChartData(question: SurveyQuestionWithOptions, answers: AnswerWithResponse[]) {
  const questionAnswers = answersForQuestion(question.id, answers);
  const total = answeredResponseCount(question, answers);

  return sortByPosition(question.survey_options).map((option) => {
    const count = questionAnswers.filter((answer) =>
      (answer.selected_option_ids ?? []).includes(option.id),
    ).length;

    return {
      count,
      label: option.label,
      percentage: percent(count, total),
    };
  });
}

function ratingChartData(question: SurveyQuestionWithOptions, answers: AnswerWithResponse[]) {
  const scale = question.rating_scale === 10 ? 10 : 5;
  const questionAnswers = answersForQuestion(question.id, answers);
  const total = answeredResponseCount(question, answers);

  return Array.from({ length: scale }, (_, index) => {
    const rating = index + 1;
    const count = questionAnswers.filter((answer) => answer.rating_value === rating).length;

    return {
      count,
      label: String(rating),
      percentage: percent(count, total),
    };
  });
}

function openTextRows(
  question: SurveyQuestionWithOptions,
  answers: AnswerWithResponse[],
  responsesById: Map<string, SurveyResponseRow>,
) {
  return answersForQuestion(question.id, answers)
    .filter((answer) => (answer.text_value ?? "").trim())
    .sort((left, right) => answerSubmittedAt(left, responsesById).localeCompare(answerSubmittedAt(right, responsesById)))
    .map((answer, index) => ({
      label: responseLabel(index),
      submittedAt: answerSubmittedAt(answer, responsesById),
      text: (answer.text_value ?? "").trim(),
    }));
}

function mapQuestionResult(
  question: SurveyQuestionWithOptions,
  answers: AnswerWithResponse[],
  responsesById: Map<string, SurveyResponseRow>,
  includeOpenText: boolean,
): SurveyQuestionResult {
  const options = sortByPosition(question.survey_options).map((option) => ({
    id: option.id,
    label: option.label,
    position: option.position,
  }));
  const chartData =
    question.type === "multiple_choice" || question.type === "multiple_select"
      ? choiceChartData(question, answers)
      : question.type === "rating"
        ? ratingChartData(question, answers)
        : [];

  return {
    chartData,
    id: question.id,
    openTextResponses: includeOpenText && question.type === "open_text" ? openTextRows(question, answers, responsesById) : [],
    options,
    position: question.position,
    prompt: question.prompt,
    ratingScale: question.rating_scale === 5 || question.rating_scale === 10 ? question.rating_scale : null,
    responseCount: answeredResponseCount(question, answers),
    type: question.type,
  };
}

function buildResults(
  surveys: SurveyWithQuestions[],
  responses: SurveyResponseRow[],
  answers: AnswerWithResponse[],
  includeOpenText: boolean,
): SurveyResult[] {
  const responsesBySurveyId = new Map<string, SurveyResponseRow[]>();
  const responsesById = new Map(responses.map((response) => [response.id, response]));

  for (const response of responses) {
    const existing = responsesBySurveyId.get(response.survey_id) ?? [];
    existing.push(response);
    responsesBySurveyId.set(response.survey_id, existing);
  }

  return surveys.map((survey) => {
    const surveyResponses = responsesBySurveyId.get(survey.id) ?? [];
    const responseIds = new Set(surveyResponses.map((response) => response.id));
    const surveyAnswers = answers.filter((answer) => responseIds.has(answer.survey_response_id));

    return {
      id: survey.id,
      lastUpdated: survey.updated_at,
      presentationHref: `/events/${survey.event_id}/presentation/surveys/${survey.id}`,
      questions: sortByPosition(survey.survey_questions).map((question) =>
        mapQuestionResult(question, surveyAnswers, responsesById, includeOpenText),
      ),
      responseCount: surveyResponses.length,
      resultsVisibleToParticipants: survey.results_visible_to_participants,
      status: survey.status,
      title: survey.title,
    };
  });
}

async function loadResultRows(eventId: string, options: { useAdmin?: boolean } = {}) {
  const supabase = options.useAdmin ? createSupabaseAdminClient() : await createSupabaseServerClient();
  const { data: surveyData, error: surveyError } = await supabase
    .from("surveys")
    .select(SURVEY_RESULT_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (surveyError) {
    throw new Error("Survey results could not be loaded. Refresh the page and try again.");
  }

  const surveys = (surveyData ?? []) as SurveyWithQuestions[];
  const surveyIds = surveys.map((survey) => survey.id);

  if (surveyIds.length === 0) {
    return { answers: [] as AnswerWithResponse[], responses: [] as SurveyResponseRow[], surveys };
  }

  const { data: responseData, error: responseError } = await supabase
    .from("survey_responses")
    .select("id,survey_id,participant_session_id,submitted_at")
    .in("survey_id", surveyIds)
    .order("submitted_at", { ascending: true });

  if (responseError) {
    throw new Error("Survey response counts could not be loaded. Refresh the page and try again.");
  }

  const responses = (responseData ?? []) as SurveyResponseRow[];
  const responseIds = responses.map((response) => response.id);

  if (responseIds.length === 0) {
    return { answers: [] as AnswerWithResponse[], responses, surveys };
  }

  const { data: answerData, error: answerError } = await supabase
    .from("survey_answers")
    .select("id,survey_response_id,survey_question_id,selected_option_ids,rating_value,text_value,survey_responses(id,survey_id,submitted_at)")
    .in("survey_response_id", responseIds);

  if (answerError) {
    throw new Error("Survey answer results could not be loaded. Refresh the page and try again.");
  }

  return {
    answers: (answerData ?? []) as AnswerWithResponse[],
    responses,
    surveys,
  };
}

export async function getOrganiserSurveyResults(userId: string, eventId: string): Promise<SurveyResult[]> {
  await assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);
  const { answers, responses, surveys } = await loadResultRows(eventId);

  return buildResults(surveys, responses, answers, true);
}

export async function getPresentationSurveyResults(
  userId: string,
  eventId: string,
  surveyId: string,
): Promise<PresentationSurveyResults> {
  const access = await getPresenterEventAccess(userId, eventId);
  const { answers, responses, surveys } = await loadResultRows(eventId);
  const [result] = buildResults(
    surveys.filter((survey) => survey.id === surveyId),
    responses,
    answers,
    false,
  );

  if (!result) {
    throw new Error("Survey presentation results could not be loaded.");
  }

  return { access, result };
}

export async function getParticipantVisibleSurveyResults(
  eventId: string,
  rawToken: string,
  surveyId: string,
): Promise<SurveyResult[]> {
  const participantSession = await validateParticipantSession(eventId, rawToken);
  const { answers, responses, surveys } = await loadResultRows(eventId, { useAdmin: true });
  const hasCompletedSurvey = responses.some(
    (response) => response.survey_id === surveyId && response.participant_session_id === participantSession.id,
  );

  if (!hasCompletedSurvey) {
    return [];
  }

  const visibleSurveys = surveys.filter(
    (survey) =>
      survey.id === surveyId &&
      survey.results_visible_to_participants && (survey.status === "published" || survey.status === "closed"),
  );

  return buildResults(visibleSurveys, responses, answers, false);
}
