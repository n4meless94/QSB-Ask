"use server";

import { redirect } from "next/navigation";

import { createEventForOrganiser } from "@/lib/events/events";
import type { CreateEventFieldErrors } from "@/lib/events/validation";
import { createEventSchema } from "@/lib/events/validation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CreateEventActionResult =
  | { ok: true }
  | {
      ok: false;
      message: string;
      fieldErrors: CreateEventFieldErrors;
    };

export async function createEventAction(formData: FormData): Promise<CreateEventActionResult> {
  const parsed = createEventSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Fix the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  await createEventForOrganiser(user.id, {
    ...parsed.data,
    organiserEmail: user.email,
  });

  redirect("/dashboard");
}
