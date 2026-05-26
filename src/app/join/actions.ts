"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getParticipantCookieName,
  joinParticipantEvent,
} from "@/lib/participants/session";

export type JoinParticipantActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: {
    display_name?: string;
    email?: string;
    join_code?: string;
  };
};

function fieldErrorFor(message: string): JoinParticipantActionResult["fieldErrors"] {
  if (message.includes("Display name")) return { display_name: message };
  if (message.includes("Email") || message.includes("email")) return { email: message };
  if (message.includes("code")) return { join_code: message };
  return {};
}

export async function joinParticipantAction(
  previousStateOrFormData: JoinParticipantActionResult | FormData,
  maybeFormData?: FormData,
): Promise<JoinParticipantActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);

  if (!formData) {
    return {
      ok: false,
      message: "Enter the event code shared by the organiser.",
      fieldErrors: { join_code: "Join code is required." },
    };
  }

  try {
    const joined = await joinParticipantEvent(String(formData.get("join_code") ?? ""), {
      display_name: String(formData.get("display_name") ?? ""),
      email: String(formData.get("email") ?? ""),
    });
    const cookieStore = await cookies();

    cookieStore.set(getParticipantCookieName(joined.event.id), joined.rawToken, {
      httpOnly: true,
      maxAge: 60 * 60 * 8,
      path: `/join/${joined.event.join_code}`,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    redirect(`/join/${joined.event.join_code}/qna`);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("NEXT_REDIRECT") || error.message.startsWith("REDIRECT:"))
    ) {
      throw error;
    }

    const message = error instanceof Error ? error.message : "Join failed. Check the code and try again.";

    return {
      ok: false,
      message,
      fieldErrors: fieldErrorFor(message),
    };
  }
}
