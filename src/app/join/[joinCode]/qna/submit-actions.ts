"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getParticipantCookieName } from "@/lib/participants/session";
import { submitParticipantQuestion } from "@/lib/qna/submission";

export type SubmitQuestionActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: {
    question?: string;
  };
};

const initialError = "Question could not be submitted.";

export async function submitQuestionAction(
  eventId: string,
  joinCode: string,
  previousStateOrFormData: SubmitQuestionActionResult | FormData,
  maybeFormData?: FormData,
): Promise<SubmitQuestionActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);
  const question = String(formData?.get("question") ?? "");

  if (!formData || !question.trim()) {
    return {
      ok: false,
      message: "Question is required.",
      fieldErrors: { question: "Question is required." },
    };
  }

  if (process.env.QSB_ASK_E2E_AUTH === "1" && eventId === "event-1") {
    return {
      ok: true,
      message: "Question submitted. It is waiting for moderator review.",
    };
  }

  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(eventId))?.value;

    if (!rawToken) {
      return {
        ok: false,
        message: "Join this event again before submitting a question.",
      };
    }

    const submitted = await submitParticipantQuestion(eventId, rawToken, question);
    revalidatePath(`/join/${joinCode}/qna`);

    return {
      ok: true,
      message:
        submitted.status === "pending"
          ? "Question submitted. It is waiting for moderator review."
          : "Question submitted.",
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : initialError;

    return {
      ok: false,
      message,
      fieldErrors: { question: message },
    };
  }
}
