"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import {
  checkAccountLockout,
  recordLoginAttempt,
} from "@/lib/auth/lockout";
import {
  normalizeEmail,
  readFormString,
  validatePasswordStrength,
} from "@/lib/auth/validation";
import {
  clearSessionActivityCookieStore,
  touchSessionActivityCookieStore,
} from "@/lib/auth/session";
import { getRuntimeEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function buildAuthRedirect(path: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);

  return `${path}?${query.toString()}`;
}

function isRedirectSignal(error: unknown) {
  return (
    error instanceof Error &&
    (error.message.startsWith("NEXT_REDIRECT") || error.message.startsWith("REDIRECT:"))
  );
}

async function readAttemptMetadata() {
  const headerStore = await headers();

  return {
    ipAddress:
      headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headerStore.get("x-real-ip"),
    userAgent: headerStore.get("user-agent"),
  };
}

export async function signInAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = readFormString(formData, "password");
  const invalidRedirect = buildAuthRedirect("/login", { error: "invalid", email });

  if (!email || !password) {
    redirect(invalidRedirect);
  }

  try {
    const lockout = await checkAccountLockout(email);

    if (lockout.locked) {
      redirect(buildAuthRedirect("/login", { error: "locked", email }));
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    const metadata = await readAttemptMetadata();

    await recordLoginAttempt({
      email,
      success: !error,
      ...metadata,
    });

    if (error) {
      const updatedLockout = await checkAccountLockout(email);

      if (updatedLockout.locked) {
        redirect(buildAuthRedirect("/login", { error: "locked", email }));
      }

      redirect(invalidRedirect);
    }

    await touchSessionActivityCookieStore();
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    redirect(buildAuthRedirect("/login", { error: "server", email }));
  }

  redirect("/dashboard");
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();
  await clearSessionActivityCookieStore();
  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const email = normalizeEmail(formData.get("email"));

  if (!email) {
    redirect(buildAuthRedirect("/password-reset", { error: "reset" }));
  }

  try {
    const env = getRuntimeEnv();
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${env.nextPublicSiteUrl}/auth/callback?next=/password-reset/confirm`,
    });

    if (error) {
      redirect(buildAuthRedirect("/password-reset", { error: "reset", email }));
    }
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    redirect(buildAuthRedirect("/password-reset", { error: "reset", email }));
  }

  redirect("/password-reset?sent=1");
}

export async function confirmPasswordResetAction(formData: FormData) {
  const password = readFormString(formData, "password");
  const confirmPassword = readFormString(formData, "confirmPassword");

  if (password !== confirmPassword) {
    redirect("/password-reset/confirm?error=mismatch");
  }

  if (!validatePasswordStrength(password)) {
    redirect("/password-reset/confirm?error=weak-password");
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      redirect("/password-reset/confirm?error=expired");
    }
  } catch (error) {
    if (isRedirectSignal(error)) {
      throw error;
    }

    redirect("/password-reset/confirm?error=expired");
  }

  redirect("/login?reset=success");
}
