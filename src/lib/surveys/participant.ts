import "server-only";

import { validateParticipantSession } from "@/lib/participants/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SurveyQuestionType, SurveyStatus } from "@/types/app";

type SurveyRow = Tables<"surveys">;
type SurveyQuestionRow = Tables<"survey_questions">;
type SurveyOptionRow = Tables<"survey_options">;

type SurveyQuestionWithOptions = SurveyQuestionRow & {
  survey_options?: SurveyOptionRow[] | null;
};

type SurveyWithQuestions = SurveyRow & {
  survey_questions?: SurveyQuestionWithOptions[] | null;
};

export type ParticipantSurveyQuestion = {
  id: string;
  options: Array<{ id: string; label: string; position: number }>;
  position: number;
  prompt: string;
  ratingScale: 5 | 10 | null;
  type: SurveyQuestionType;
};

export type ParticipantSurvey = {
  id: string;
  resultsVisibleToParticipants: boolean;
  status: SurveyStatus;
  title: string;
  questions: ParticipantSurveyQuestion[];
};

export type ParticipantSurveyPageState = {
  completed: boolean;
  message: string;
  results: { visible: boolean };
  state: "available" | "closed" | "unavailable";
  survey: ParticipantSurvey | null;
};

export type ParticipantSurveyAnswerInput = {
  questionId: string;
  selectedOptionIds?: string[];
  ratingValue?: number;
  textValue?: string;
};

type SubmitSurveyRpcRow = {
  already_submitted: boolean;
  response_id: string | null;
};

const PARTICIPANT_SURVEY_SELECT =
  "id,event_id,title,status,results_visible_to_participants,created_at,updated_at,created_by,survey_questions(id,survey_id,type,prompt,position,rating_scale,created_at,survey_options(id,survey_question_id,label,position))";

function mapSurvey(row: SurveyWithQuestions): ParticipantSurvey {
  return {
    id: row.id,
    questions: (row.survey_questions ?? [])
      .slice()
      .sort((left, right) => left.position - right.position)
      .map((question) => ({
        id: question.id,
        options: (question.survey_options ?? [])
          .slice()
          .sort((left, right) => left.position - right.position)
          .map((option) => ({
            id: option.id,
            label: option.label,
            position: option.position,
          })),
        position: question.position,
        prompt: question.prompt,
        ratingScale: question.rating_scale === 5 || question.rating_scale === 10 ? question.rating_scale : null,
        type: question.type,
      })),
    resultsVisibleToParticipants: row.results_visible_to_participants,
    status: row.status,
    title: row.title,
  };
}

function unavailableState(message = "No surveys are open"): ParticipantSurveyPageState {
  return {
    completed: false,
    message,
    results: { visible: false },
    state: "unavailable",
    survey: null,
  };
}

function isDuplicateResponseError(error: { code?: string; message?: string }) {
  return (
    error.code === "23505" ||
    /survey_responses_one_per_session|duplicate key|unique constraint/i.test(error.message ?? "")
  );
}

function answerForQuestion(
  question: ParticipantSurveyQuestion,
  answersByQuestionId: Map<string, ParticipantSurveyAnswerInput>,
) {
  const answer = answersByQuestionId.get(question.id);
  const optionIds = new Set(question.options.map((option) => option.id));

  if (!answer) {
    throw new Error("Answer every survey question before submitting.");
  }

  if (question.type === "multiple_choice") {
    const selected = answer.selectedOptionIds ?? [];

    if (selected.length !== 1 || !optionIds.has(selected[0])) {
      throw new Error(`Choose one answer for "${question.prompt}".`);
    }

    return {
      survey_question_id: question.id,
      selected_option_ids: selected,
    };
  }

  if (question.type === "multiple_select") {
    const selected = [...new Set(answer.selectedOptionIds ?? [])];

    if (selected.length === 0 || selected.some((optionId) => !optionIds.has(optionId))) {
      throw new Error(`Choose at least one answer for "${question.prompt}".`);
    }

    return {
      survey_question_id: question.id,
      selected_option_ids: selected,
    };
  }

  if (question.type === "rating") {
    const ratingValue = answer.ratingValue;

    if (
      !Number.isInteger(ratingValue) ||
      !question.ratingScale ||
      ratingValue < 1 ||
      ratingValue > question.ratingScale
    ) {
      throw new Error(`Choose a rating for "${question.prompt}".`);
    }

    return {
      rating_value: ratingValue,
      survey_question_id: question.id,
    };
  }

  const textValue = (answer.textValue ?? "").trim();

  if (!textValue) {
    throw new Error(`Enter a response for "${question.prompt}".`);
  }

  if (textValue.length > 2000) {
    throw new Error(`Response for "${question.prompt}" must be 2000 characters or fewer.`);
  }

  return {
    survey_question_id: question.id,
    text_value: textValue,
  };
}

async function loadSurveyForParticipant(eventId: string, surveyId?: string) {
  const supabase = await createSupabaseServerClient();
  const query = supabase
    .from("surveys")
    .select(PARTICIPANT_SURVEY_SELECT)
    .eq("event_id", eventId)
    .order("updated_at", { ascending: false });

  const finalQuery = surveyId ? query.eq("id", surveyId).single() : query.limit(1).maybeSingle();
  const { data, error } = await finalQuery;

  if (error || !data) {
    return null;
  }

  return mapSurvey(data as SurveyWithQuestions);
}

async function hasSubmittedSurvey(surveyId: string, participantSessionId: string) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .select("id")
    .eq("survey_id", surveyId)
    .eq("participant_session_id", participantSessionId)
    .limit(1);

  if (error) {
    throw new Error("Survey response status could not be checked.");
  }

  return (data ?? []).length > 0;
}

export async function loadParticipantSurvey(
  eventId: string,
  rawToken: string,
  surveyId?: string,
): Promise<ParticipantSurveyPageState> {
  const participantSession = await validateParticipantSession(eventId, rawToken);
  const survey = await loadSurveyForParticipant(eventId, surveyId);

  if (!survey) {
    return unavailableState();
  }

  if (survey.status === "closed") {
    return {
      completed: false,
      message: "This survey is closed. New responses are no longer being accepted.",
      results: { visible: survey.resultsVisibleToParticipants },
      state: "closed",
      survey,
    };
  }

  if (survey.status !== "published") {
    return unavailableState();
  }

  const completed = await hasSubmittedSurvey(survey.id, participantSession.id);

  return {
    completed,
    message: completed ? "You have already submitted this survey." : "",
    results: { visible: survey.resultsVisibleToParticipants },
    state: "available",
    survey,
  };
}

export async function submitParticipantSurvey(
  eventId: string,
  rawToken: string,
  surveyId: string,
  answers: ParticipantSurveyAnswerInput[],
) {
  const participantSession = await validateParticipantSession(eventId, rawToken);
  const survey = await loadSurveyForParticipant(eventId, surveyId);

  if (!survey || survey.status !== "published") {
    throw new Error("No surveys are open.");
  }

  const answersByQuestionId = new Map(answers.map((answer) => [answer.questionId, answer]));
  const targetAnswers = survey.questions.map((question) => answerForQuestion(question, answersByQuestionId));
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.rpc("submit_survey_response", {
    target_answers: targetAnswers as Json,
    target_participant_session_id: participantSession.id,
    target_survey_id: surveyId,
  });

  if (error) {
    if (isDuplicateResponseError(error)) {
      throw new Error("You have already submitted this survey.");
    }

    throw new Error(error.message || "Your survey response could not be submitted. Check your connection and try again.");
  }

  const result = (data as SubmitSurveyRpcRow[] | null)?.[0];

  if (!result) {
    throw new Error("Your survey response could not be submitted. Check your connection and try again.");
  }

  if (result.already_submitted) {
    throw new Error("You have already submitted this survey.");
  }

  return {
    responseId: result.response_id,
    resultsVisibleToParticipants: survey.resultsVisibleToParticipants,
  };
}
