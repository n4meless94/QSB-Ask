import { createHash } from "node:crypto";

import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const FAILED_ATTEMPT_WINDOW_SECONDS = 15 * 60;
const LOCKOUT_SECONDS = 30 * 60;
const LOCKOUT_THRESHOLD = 5;

type LoginAttempt = {
  attempted_at: string;
};

export type AccountLockoutState = {
  locked: boolean;
  lockedUntil: Date | null;
};

function hashAttemptMetadata(ipAddress?: string | null, userAgent?: string | null) {
  const raw = [ipAddress, userAgent].filter(Boolean).join("|");

  if (!raw) {
    return null;
  }

  return createHash("sha256").update(raw).digest("hex");
}

function findActiveLockout(attempts: LoginAttempt[], now: Date): AccountLockoutState {
  const sortedAttempts = attempts
    .map((attempt) => new Date(attempt.attempted_at))
    .filter((attemptedAt) => Number.isFinite(attemptedAt.getTime()))
    .sort((a, b) => b.getTime() - a.getTime());

  for (let index = 0; index <= sortedAttempts.length - LOCKOUT_THRESHOLD; index += 1) {
    const newestAttempt = sortedAttempts[index];
    const oldestAttempt = sortedAttempts[index + LOCKOUT_THRESHOLD - 1];
    const windowSeconds = (newestAttempt.getTime() - oldestAttempt.getTime()) / 1000;

    if (windowSeconds <= FAILED_ATTEMPT_WINDOW_SECONDS) {
      const lockedUntil = new Date(newestAttempt.getTime() + LOCKOUT_SECONDS * 1000);

      if (lockedUntil > now) {
        return { locked: true, lockedUntil };
      }
    }
  }

  return { locked: false, lockedUntil: null };
}

export async function checkAccountLockout(email: string, now = new Date()) {
  const admin = createSupabaseAdminClient();
  const earliestRelevantAttempt = new Date(
    now.getTime() - (FAILED_ATTEMPT_WINDOW_SECONDS + LOCKOUT_SECONDS) * 1000,
  ).toISOString();

  const { data, error } = await admin
    .from("login_attempts")
    .select("attempted_at, success")
    .eq("email", email)
    .eq("success", false)
    .gte("attempted_at", earliestRelevantAttempt)
    .order("attempted_at", { ascending: false });

  if (error) {
    throw new Error("Unable to read login attempts.");
  }

  return findActiveLockout(data ?? [], now);
}

export async function recordLoginAttempt({
  attemptedAt = new Date(),
  email,
  ipAddress,
  success,
  userAgent,
}: {
  attemptedAt?: Date;
  email: string;
  ipAddress?: string | null;
  success: boolean;
  userAgent?: string | null;
}) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("login_attempts").insert({
    attempted_at: attemptedAt.toISOString(),
    email,
    ip_hash: hashAttemptMetadata(ipAddress, userAgent),
    success,
  });

  if (error) {
    throw new Error("Unable to record login attempt.");
  }
}
