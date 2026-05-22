"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
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

export async function createEventAction(
  previousStateOrFormData: CreateEventActionResult | FormData,
  maybeFormData?: FormData,
): Promise<CreateEventActionResult> {
  const formData =
    maybeFormData ?? (previousStateOrFormData instanceof FormData ? previousStateOrFormData : null);

  if (!formData) {
    return {
      ok: false,
      message: "Fix the highlighted fields and try again.",
      fieldErrors: {},
    };
  }

  const parsed = createEventSchema.safeParse(formData);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Fix the highlighted fields and try again.",
      fieldErrors: parsed.fieldErrors,
    };
  }

  const cookieStore = await cookies();

  if (isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)) {
    redirect(
      `/dashboard?createdName=${encodeURIComponent(parsed.data.name)}&createdCode=E2E9SAVE`,
    );
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
