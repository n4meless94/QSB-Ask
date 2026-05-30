"use server";

import { revalidatePath } from "next/cache";

import {
  archiveEvent,
  closeEvent,
  eventSettingsSchema,
  type EventSettingsFieldErrors,
  updateEventSettings,
} from "@/lib/events/settings";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EventSettingsActionResult = {
  ok: boolean;
  message: string;
  fieldErrors?: EventSettingsFieldErrors;
};

async function signedInUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Sign in again to manage event settings.");
  }

  return user.id;
}

export async function updateEventSettingsAction(
  eventId: string,
  previousStateOrFormData: EventSettingsActionResult | FormData,
  maybeFormData?: FormData,
): Promise<EventSettingsActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);

  if (!formData) {
    return { ok: false, message: "Fix the highlighted fields and try again.", fieldErrors: {} };
  }

  const parsed = eventSettingsSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Fix the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  try {
    const userId = await signedInUserId();
    await updateEventSettings(userId, eventId, formData);
    revalidatePath(`/events/${eventId}`);

    return { ok: true, message: "Event settings saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Event settings could not be saved.",
    };
  }
}

export async function closeEventAction(eventId: string): Promise<EventSettingsActionResult> {
  try {
    const userId = await signedInUserId();
    await closeEvent(userId, eventId);
    revalidatePath(`/events/${eventId}`);

    return { ok: true, message: "Event closed." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Event could not be closed.",
    };
  }
}

export async function closeEventFormAction(eventId: string): Promise<void> {
  await closeEventAction(eventId);
}

export async function archiveEventAction(eventId: string): Promise<EventSettingsActionResult> {
  try {
    const userId = await signedInUserId();
    await archiveEvent(userId, eventId);
    revalidatePath(`/events/${eventId}`);

    return { ok: true, message: "Event archived." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Event could not be archived.",
    };
  }
}

export async function archiveEventFormAction(eventId: string): Promise<void> {
  await archiveEventAction(eventId);
}
