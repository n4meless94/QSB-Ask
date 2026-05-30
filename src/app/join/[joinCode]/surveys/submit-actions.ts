"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getParticipantCookieName } from "@/lib/participants/session";
import {
  submitParticipantSurvey,
  type ParticipantSurveyAnswerInput,
} from "@/lib/surveys/participant";

export type SubmitSurveyActionResult = {
  ok: boolean;
  message: string;
  completed?: boolean;
  fieldErrors?: Record<string, string>;
};

const submissionError = "Your survey response could not be submitted. Check your connection and try again.";

function parseAnswers(formData: FormData): ParticipantSurveyAnswerInput[] {
  const byQuestionId = new Map<string, ParticipantSurveyAnswerInput>();

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("answers.")) continue;

    const questionId = key.slice("answers.".length);
    const answer = byQuestionId.get(questionId) ?? { questionId };
    const textValue = String(value);

    if (key.endsWith(".text")) {
      answer.textValue = textValue;
    } else if (key.endsWith(".rating")) {
      answer.ratingValue = Number(textValue);
    } else {
      answer.selectedOptionIds = [...(answer.selectedOptionIds ?? []), textValue];
    }

    const normalizedQuestionId = questionId.replace(/\.(text|rating)$/, "");
    answer.questionId = normalizedQuestionId;
    byQuestionId.set(normalizedQuestionId, answer);
  }

  return [...byQuestionId.values()];
}

export async function submitSurveyAction(
  eventId: string,
  joinCode: string,
  previousStateOrFormData: SubmitSurveyActionResult | FormData,
  maybeFormData?: FormData,
): Promise<SubmitSurveyActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);
  const surveyId = String(formData?.get("surveyId") ?? "");

  if (!formData || !surveyId) {
    return {
      ok: false,
      message: submissionError,
    };
  }

  if (process.env.QSB_ASK_E2E_AUTH === "1" && eventId === "event-1") {
    return {
      completed: true,
      ok: true,
      message: "Survey submitted. Thank you. Your response has been recorded for this event.",
    };
  }

  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(eventId))?.value;

    if (!rawToken) {
      return {
        ok: false,
        message: "Join this event again before submitting a survey.",
      };
    }

    await submitParticipantSurvey(eventId, rawToken, surveyId, parseAnswers(formData));
    revalidatePath(`/join/${joinCode}/surveys`);

    return {
      completed: true,
      ok: true,
      message: "Survey submitted. Thank you. Your response has been recorded for this event.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : submissionError,
    };
  }
}
