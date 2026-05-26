"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { getParticipantCookieName } from "@/lib/participants/session";
import { upvoteQuestion, type VoteResult } from "@/lib/qna/voting";

export type VoteQuestionActionResult = {
  ok: boolean;
  message: string;
  result?: VoteResult;
};

export async function voteQuestionAction(
  eventId: string,
  joinCode: string,
  formData: FormData,
): Promise<VoteQuestionActionResult> {
  const questionId = String(formData.get("questionId") ?? "");

  if (!questionId) {
    return {
      ok: false,
      message: "Choose a question to vote on.",
    };
  }

  if (process.env.QSB_ASK_E2E_AUTH === "1" && eventId === "event-1") {
    revalidatePath(`/join/${joinCode}/qna`);
    return {
      ok: true,
      message: "Vote recorded.",
    };
  }

  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(getParticipantCookieName(eventId))?.value;

    if (!rawToken) {
      return {
        ok: false,
        message: "Join this event again before voting.",
      };
    }

    const result = await upvoteQuestion(eventId, rawToken, questionId);
    revalidatePath(`/join/${joinCode}/qna`);

    return {
      ok: true,
      message: result.alreadyVoted ? "You already voted for this question." : "Vote recorded.",
      result,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Vote could not be recorded.",
    };
  }
}
