"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import {
  getParticipantCookieName,
  joinParticipantEvent,
  type JoinableEvent,
} from "@/lib/participants/session";
import {
  normaliseJoinCode,
  validateParticipantIdentity,
} from "@/lib/participants/validation";

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

function participantCookieOptions() {
  return {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/join",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function e2eEvent(code: string): JoinableEvent | null {
  const normalizedCode = normaliseJoinCode(code);

  if (normalizedCode === "QSB2X9ZA") {
    return {
      id: "event-1",
      identity_mode: "name_required",
      join_code: "QSB2X9ZA",
      name: "Quarterly Briefing",
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  if (normalizedCode === "QSB7HALL") {
    return {
      id: "event-1",
      identity_mode: "anonymous",
      join_code: "QSB7HALL",
      name: "Town Hall",
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  if (normalizedCode === "QSBEMAIL") {
    return {
      id: "event-1",
      identity_mode: "name_email_required",
      join_code: "QSBEMAIL",
      name: "Stakeholder Briefing",
      participant_realtime_enabled: true,
      status: "active",
    };
  }

  return null;
}

async function joinE2EParticipantEvent(
  joinCode: string,
  identity: { display_name?: string; email?: string },
) {
  if (process.env.QSB_ASK_E2E_AUTH !== "1") return null;

  const event = e2eEvent(joinCode);

  if (!event) {
    throw new Error("We could not find an active event for that code.");
  }

  validateParticipantIdentity(event.identity_mode, identity);

  const cookieStore = await cookies();
  cookieStore.set(
    getParticipantCookieName(event.id),
    "e2e-participant-token",
    participantCookieOptions(),
  );

  redirect(`/join/${event.join_code}/qna`);
}

export async function autoJoinAnonymousParticipantAction(formData: FormData) {
  const joinCode = String(formData.get("join_code") ?? "");

  try {
    await joinE2EParticipantEvent(joinCode, {});

    const joined = await joinParticipantEvent(joinCode, {});
    const cookieStore = await cookies();

    cookieStore.set(
      getParticipantCookieName(joined.event.id),
      joined.rawToken,
      participantCookieOptions(),
    );

    redirect(`/join/${joined.event.join_code}/qna`);
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("NEXT_REDIRECT") || error.message.startsWith("REDIRECT:"))
    ) {
      throw error;
    }

    redirect(`/join/${encodeURIComponent(joinCode)}?join=manual`);
  }
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
    await joinE2EParticipantEvent(String(formData.get("join_code") ?? ""), {
      display_name: String(formData.get("display_name") ?? ""),
      email: String(formData.get("email") ?? ""),
    });

    const joined = await joinParticipantEvent(String(formData.get("join_code") ?? ""), {
      display_name: String(formData.get("display_name") ?? ""),
      email: String(formData.get("email") ?? ""),
    });
    const cookieStore = await cookies();

    cookieStore.set(
      getParticipantCookieName(joined.event.id),
      joined.rawToken,
      participantCookieOptions(),
    );

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
