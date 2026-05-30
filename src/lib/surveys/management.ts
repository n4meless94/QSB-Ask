import "server-only";

import { assertEventRole } from "@/lib/events/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";
import type { Tables } from "@/lib/supabase/database.types";
import {
  normaliseSurveyDraft,
  validateSurveyForPublish,
  validateSurveyForSave,
  type NormalisedSurveyDraft,
  type SurveyDraftInput,
  type SurveyValidationErrors,
} from "@/lib/surveys/validation";
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

export type SurveyQuestionSummary = {
  id: string;
  options: Array<{ id: string; label: string; position: number }>;
  position: number;
  prompt: string;
  ratingScale: 5 | 10 | null;
  type: SurveyQuestionType;
};

export type SurveySummary = {
  created_at: string;
  event_id: string;
  id: string;
  questions: SurveyQuestionSummary[];
  results_visible_to_participants: boolean;
  status: SurveyStatus;
  title: string;
  updated_at: string;
};

export type SurveyMutationResult = {
  ok: boolean;
  message: string;
  errors?: SurveyValidationErrors;
  survey?: SurveySummary;
};

const SURVEY_SELECT =
  "id,event_id,title,status,results_visible_to_participants,created_at,updated_at,created_by,survey_questions(id,survey_id,type,prompt,position,rating_scale,created_at,survey_options(id,survey_question_id,label,position))";

function mapSurvey(row: SurveyWithQuestions): SurveySummary {
  return {
    created_at: row.created_at,
    event_id: row.event_id,
    id: row.id,
    questions: (row.survey_questions ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((question) => ({
        id: question.id,
        options: (question.survey_options ?? [])
          .slice()
          .sort((a, b) => a.position - b.position)
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
    results_visible_to_participants: row.results_visible_to_participants,
    status: row.status,
    title: row.title,
    updated_at: row.updated_at,
  };
}

async function requireOrganiser(userId: string, eventId: string) {
  return assertEventRole(userId, eventId, EVENT_MANAGEMENT_ROLES);
}

async function loadSurvey(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  eventId: string,
  surveyId: string,
) {
  const { data, error } = await supabase
    .from("surveys")
    .select(SURVEY_SELECT)
    .eq("event_id", eventId)
    .eq("id", surveyId)
    .single();

  if (error || !data) {
    throw new Error("Survey could not be loaded. Refresh the page and try again.");
  }

  return mapSurvey(data as SurveyWithQuestions);
}

function draftFromSurvey(survey: SurveySummary): SurveyDraftInput {
  return {
    questions: survey.questions.map((question) => ({
      id: question.id,
      options: question.options.map((option) => option.label),
      prompt: question.prompt,
      ratingScale: question.ratingScale,
      type: question.type,
    })),
    surveyId: survey.id,
    title: survey.title,
  };
}

export async function listSurveysForOrganiser(userId: string, eventId: string): Promise<SurveySummary[]> {
  await requireOrganiser(userId, eventId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .select(SURVEY_SELECT)
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error("Surveys could not be loaded. Refresh the page or try again.");
  }

  return ((data ?? []) as SurveyWithQuestions[]).map(mapSurvey);
}

export async function createSurvey(
  userId: string,
  eventId: string,
  title: string,
): Promise<SurveySummary> {
  await requireOrganiser(userId, eventId);

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    throw new Error("Survey title is required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      created_by: userId,
      event_id: eventId,
      results_visible_to_participants: false,
      status: "draft",
      title: trimmedTitle,
    })
    .select(SURVEY_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Survey could not be created. Check the title and try again.");
  }

  return mapSurvey(data as SurveyWithQuestions);
}

async function persistSurveyDraft(eventId: string, draft: NormalisedSurveyDraft): Promise<SurveySummary> {
  const supabase = await createSupabaseServerClient();
  const { data: updatedSurvey, error: surveyError } = await supabase
    .from("surveys")
    .update({ title: draft.title })
    .eq("event_id", eventId)
    .eq("id", draft.surveyId)
    .select(SURVEY_SELECT)
    .single();

  if (surveyError || !updatedSurvey) {
    throw new Error("Survey draft could not be saved. Refresh the page and try again.");
  }

  const { error: deleteError } = await supabase
    .from("survey_questions")
    .delete()
    .eq("survey_id", draft.surveyId);

  if (deleteError) {
    throw new Error("Survey questions could not be replaced. Refresh the page and try again.");
  }

  if (draft.questions.length === 0) {
    return mapSurvey({ ...(updatedSurvey as SurveyWithQuestions), survey_questions: [] });
  }

  const questionRows = draft.questions.map((question, position) => ({
    position,
    prompt: question.prompt,
    rating_scale: question.type === "rating" ? question.ratingScale : null,
    survey_id: draft.surveyId,
    type: question.type,
  }));

  const { data: insertedQuestions, error: questionError } = await supabase
    .from("survey_questions")
    .insert(questionRows)
    .select("id,position")
    .order("position", { ascending: true });

  if (questionError || !insertedQuestions) {
    throw new Error("Survey questions could not be saved. Check each question and try again.");
  }

  const optionRows = draft.questions.flatMap((question, questionIndex) => {
    if (question.type !== "multiple_choice" && question.type !== "multiple_select") {
      return [];
    }

    const insertedQuestion = insertedQuestions.find((row) => row.position === questionIndex);
    if (!insertedQuestion) {
      throw new Error("Survey options could not be matched to saved questions.");
    }

    return question.options.map((label, position) => ({
      label,
      position,
      survey_question_id: insertedQuestion.id,
    }));
  });

  if (optionRows.length > 0) {
    const { error: optionError } = await supabase.from("survey_options").insert(optionRows);

    if (optionError) {
      throw new Error("Survey answer options could not be saved. Check each option and try again.");
    }
  }

  return mapSurvey({ ...(updatedSurvey as SurveyWithQuestions), survey_questions: [] });
}

export async function saveSurveyDraft(
  userId: string,
  eventId: string,
  input: SurveyDraftInput,
): Promise<SurveyMutationResult> {
  await requireOrganiser(userId, eventId);

  const validation = validateSurveyForSave(input);
  if (!validation.ok || !validation.draft) {
    return {
      errors: validation.errors,
      message: "Survey draft has validation errors.",
      ok: false,
    };
  }

  const survey = await persistSurveyDraft(eventId, validation.draft);

  return { ok: true, message: "Survey draft saved.", survey };
}

export async function publishSurvey(
  userId: string,
  eventId: string,
  surveyId: string,
  input?: SurveyDraftInput,
): Promise<SurveyMutationResult> {
  await requireOrganiser(userId, eventId);

  const existingDraft = async () => {
    const supabase = await createSupabaseServerClient();
    return draftFromSurvey(await loadSurvey(supabase, eventId, surveyId));
  };
  const validation = validateSurveyForPublish(input ?? (await existingDraft()));
  if (!validation.ok || !validation.draft) {
    return {
      errors: validation.errors,
      message: "Survey is not ready to publish.",
      ok: false,
    };
  }

  await persistSurveyDraft(eventId, validation.draft);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .update({ status: "published" })
    .eq("event_id", eventId)
    .eq("id", surveyId)
    .select(SURVEY_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Survey could not be published. Refresh the page and try again.");
  }

  return {
    message: "Survey published.",
    ok: true,
    survey: mapSurvey(data as SurveyWithQuestions),
  };
}

export async function closeSurvey(
  userId: string,
  eventId: string,
  surveyId: string,
): Promise<SurveyMutationResult> {
  await requireOrganiser(userId, eventId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .update({ status: "closed" })
    .eq("event_id", eventId)
    .eq("id", surveyId)
    .select(SURVEY_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Survey could not be closed. Refresh the page and try again.");
  }

  return {
    message: "Survey closed.",
    ok: true,
    survey: mapSurvey(data as SurveyWithQuestions),
  };
}

export async function saveSurveyVisibility(
  userId: string,
  eventId: string,
  surveyId: string,
  visible: boolean,
): Promise<SurveyMutationResult> {
  await requireOrganiser(userId, eventId);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .update({ results_visible_to_participants: visible })
    .eq("event_id", eventId)
    .eq("id", surveyId)
    .select(SURVEY_SELECT)
    .single();

  if (error || !data) {
    throw new Error("Survey visibility could not be saved. Refresh the page and try again.");
  }

  return {
    message: visible ? "Survey results are visible to participants." : "Survey results are hidden from participants.",
    ok: true,
    survey: mapSurvey(data as SurveyWithQuestions),
  };
}

export function surveyDraftFromFormData(formData: FormData): SurveyDraftInput {
  const surveyId = String(formData.get("surveyId") ?? "");
  const title = String(formData.get("title") ?? "");
  const questionCount = Number(formData.get("questionCount") ?? 0);
  const questions = Array.from({ length: Number.isFinite(questionCount) ? questionCount : 0 }, (_, index) => {
    const type = String(formData.get(`questions.${index}.type`) ?? "") as SurveyQuestionType;
    const optionValues = String(formData.get(`questions.${index}.options`) ?? "")
      .split("\n")
      .map((option) => option.trim())
      .filter(Boolean);

    return {
      id: String(formData.get(`questions.${index}.id`) ?? "") || undefined,
      options: optionValues,
      prompt: String(formData.get(`questions.${index}.prompt`) ?? ""),
      ratingScale: Number(formData.get(`questions.${index}.ratingScale`) ?? 5),
      type,
    };
  });

  return normaliseSurveyDraft({ questions, surveyId, title });
}
