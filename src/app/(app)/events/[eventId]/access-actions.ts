"use server";

import { revalidatePath } from "next/cache";

import { inviteEventMember, removeEventMember } from "@/lib/events/access";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { EventRole } from "@/types/app";

export type AccessActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: {
    email?: string;
    role?: string;
    memberId?: string;
  };
};

async function signedInUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sign in again to manage event access.");
  }

  return user.id;
}

function roleFromForm(value: FormDataEntryValue | null): EventRole | null {
  if (value === "moderator" || value === "speaker") {
    return value;
  }

  return null;
}

export async function inviteMemberAction(
  eventId: string,
  previousStateOrFormData: AccessActionResult | FormData,
  maybeFormData?: FormData,
): Promise<AccessActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);
  const email = String(formData?.get("email") ?? "");
  const role = roleFromForm(formData?.get("role") ?? null);

  if (!formData || !email.trim() || !role) {
    return {
      ok: false,
      message: "Fix the highlighted fields and try again.",
      fieldErrors: {
        email: email.trim() ? undefined : "Invite email is required.",
        role: role ? undefined : "Choose Moderator or Speaker access.",
      },
    };
  }

  try {
    const userId = await signedInUserId();
    await inviteEventMember(userId, eventId, email, role);
    revalidatePath(`/events/${eventId}`);

    return {
      ok: true,
      message:
        "Member access created. Invite email delivery is not active yet. Staff can sign in with that email to activate access.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Member access could not be created.",
    };
  }
}

export async function inviteMemberFormAction(eventId: string, formData: FormData): Promise<void> {
  await inviteMemberAction(eventId, formData);
}

export async function removeMemberAction(
  eventId: string,
  previousStateOrFormData: AccessActionResult | FormData,
  maybeFormData?: FormData,
): Promise<AccessActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);
  const memberId = String(formData?.get("memberId") ?? "");

  if (!formData || !memberId) {
    return {
      ok: false,
      message: "Choose a member to remove.",
      fieldErrors: { memberId: "Member is required." },
    };
  }

  try {
    const userId = await signedInUserId();
    await removeEventMember(userId, eventId, memberId);
    revalidatePath(`/events/${eventId}`);

    return {
      ok: true,
      message: "Access removed.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Member access could not be removed.",
    };
  }
}

export async function removeMemberFormAction(eventId: string, formData: FormData): Promise<void> {
  await removeMemberAction(eventId, formData);
}
