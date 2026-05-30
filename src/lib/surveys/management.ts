import "server-only";

import { assertEventRole } from "@/lib/events/access";
import type { Json } from "@/lib/supabase/database.types";
import { EVENT_MANAGEMENT_ROLES } from "@/lib/supabase/rls";
import type { Tables } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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
  const { error } = await supabase.rpc("replace_survey_draft", {
    next_questions: draft.questions.map((question, position) => ({
      options: question.options,
      position,
      prompt: question.prompt,
      rating_scale: question.type === "rating" ? question.ratingScale : null,
      type: question.type,
    })) as Json,
    next_title: draft.title,
    target_event_id: eventId,
    target_survey_id: draft.surveyId,
  });

  if (error) {
    throw new Error("Survey draft could not be saved. Refresh the page and try again.");
  }

  return loadSurvey(supabase, eventId, draft.surveyId);
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
  const rawQuestionCount = Number(formData.get("questionCount") ?? 0);
  const questionCount = Number.isInteger(rawQuestionCount)
    ? Math.min(Math.max(rawQuestionCount, 0), 50)
    : 0;
  const questions = Array.from({ length: questionCount }, (_, index) => {
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
