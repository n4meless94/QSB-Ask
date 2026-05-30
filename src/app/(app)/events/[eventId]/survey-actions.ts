"use server";

import { revalidatePath } from "next/cache";

import {
  closeSurvey,
  createSurvey,
  publishSurvey,
  saveSurveyDraft,
  saveSurveyVisibility,
  surveyDraftFromFormData,
  type SurveyMutationResult,
} from "@/lib/surveys/management";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function signedInUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sign in again to manage surveys.");
  }

  return user.id;
}

function failure(error: unknown, fallback: string): SurveyMutationResult {
  return {
    message: error instanceof Error ? error.message : fallback,
    ok: false,
  };
}

export async function createSurveyAction(eventId: string, formData: FormData): Promise<SurveyMutationResult> {
  try {
    const userId = await signedInUserId();
    const title = String(formData.get("title") ?? "");
    const survey = await createSurvey(userId, eventId, title);
    revalidatePath(`/events/${eventId}`);

    return { message: "Survey created.", ok: true, survey };
  } catch (error) {
    return failure(error, "Survey could not be created.");
  }
}

export async function saveSurveyDraftAction(eventId: string, formData: FormData): Promise<SurveyMutationResult> {
  try {
    const userId = await signedInUserId();
    const result = await saveSurveyDraft(userId, eventId, surveyDraftFromFormData(formData));
    revalidatePath(`/events/${eventId}`);

    return result;
  } catch (error) {
    return failure(error, "Survey draft could not be saved.");
  }
}

export async function publishSurveyAction(eventId: string, formData: FormData): Promise<SurveyMutationResult> {
  try {
    const userId = await signedInUserId();
    const draft = surveyDraftFromFormData(formData);
    const result = await publishSurvey(userId, eventId, draft.surveyId, draft);
    revalidatePath(`/events/${eventId}`);

    return result;
  } catch (error) {
    return failure(error, "Survey could not be published.");
  }
}

export async function closeSurveyAction(
  eventId: string,
  surveyId: string,
): Promise<SurveyMutationResult> {
  try {
    const userId = await signedInUserId();
    const result = await closeSurvey(userId, eventId, surveyId);
    revalidatePath(`/events/${eventId}`);

    return result;
  } catch (error) {
    return failure(error, "Survey could not be closed.");
  }
}

export async function saveSurveyVisibilityAction(
  eventId: string,
  surveyId: string,
  visible: boolean,
): Promise<SurveyMutationResult> {
  try {
    const userId = await signedInUserId();
    const result = await saveSurveyVisibility(userId, eventId, surveyId, visible);
    revalidatePath(`/events/${eventId}`);

    return result;
  } catch (error) {
    return failure(error, "Survey visibility could not be saved.");
  }
}
