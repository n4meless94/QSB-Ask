"use server";

import { revalidatePath } from "next/cache";

import {
  archiveQuestion,
  approveQuestion,
  dismissQuestion,
  editQuestion,
  markQuestionAnswered,
  restoreQuestion,
  STALE_MODERATION_MESSAGE,
} from "@/lib/qna/moderation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { QuestionStatus } from "@/types/app";

export type ModerationActionResult = {
  ok: boolean;
  message: string;
};

type ModerationVerb = "approve" | "dismiss" | "archive" | "restore" | "mark_answered" | "edit";

const successMessages: Record<ModerationVerb, string> = {
  approve: "Question approved.",
  archive: "Question archived.",
  dismiss: "Question dismissed.",
  edit: "Question edited.",
  mark_answered: "Question marked answered.",
  restore: "Question restored.",
};

async function signedInUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sign in again to moderate this event.");
  }

  return user.id;
}

function expectedStateFromFormData(formData: FormData) {
  const questionId = String(formData.get("questionId") ?? "");
  const expectedStatus = String(formData.get("expectedStatus") ?? "") as QuestionStatus;
  const expectedUpdatedAt = String(formData.get("expectedUpdatedAt") ?? "");

  if (!questionId || !expectedStatus || !expectedUpdatedAt) {
    throw new Error(STALE_MODERATION_MESSAGE);
  }

  return {
    expected: { expectedStatus, expectedUpdatedAt },
    questionId,
  };
}

async function runAction(
  eventId: string,
  formData: FormData,
  verb: ModerationVerb,
): Promise<ModerationActionResult> {
  try {
    const userId = await signedInUserId();
    const { expected, questionId } = expectedStateFromFormData(formData);

    if (verb === "approve") {
      await approveQuestion(userId, eventId, questionId, expected);
    } else if (verb === "dismiss") {
      await dismissQuestion(userId, eventId, questionId, expected);
    } else if (verb === "archive") {
      await archiveQuestion(userId, eventId, questionId, expected);
    } else if (verb === "restore") {
      await restoreQuestion(userId, eventId, questionId, expected);
    } else if (verb === "mark_answered") {
      await markQuestionAnswered(userId, eventId, questionId, expected);
    } else {
      await editQuestion(userId, eventId, questionId, {
        ...expected,
        nextText: String(formData.get("text") ?? ""),
      });
    }

    revalidatePath(`/events/${eventId}`);
    return { ok: true, message: successMessages[verb] };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "This moderation action could not be saved.",
    };
  }
}

export async function approveQuestionAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "approve");
}

export async function dismissQuestionAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "dismiss");
}

export async function archiveQuestionAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "archive");
}

export async function restoreQuestionAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "restore");
}

export async function markQuestionAnsweredAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "mark_answered");
}

export async function editQuestionAction(eventId: string, formData: FormData) {
  return runAction(eventId, formData, "edit");
}
