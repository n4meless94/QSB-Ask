import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { getRuntimeEnv } from "@/lib/env";

export const APP_SESSION_ACTIVITY_COOKIE = "qsb_ask_last_activity";
export const DEFAULT_SESSION_IDLE_TIMEOUT_SECONDS = 28_800;

export function getSessionIdleTimeoutSeconds() {
  try {
    return getRuntimeEnv().appSessionIdleTimeoutSeconds;
  } catch {
    return DEFAULT_SESSION_IDLE_TIMEOUT_SECONDS;
  }
}

export function currentActivityTimestamp() {
  return Math.floor(Date.now() / 1000);
}

export function assertActiveSession(
  lastActivityValue: string | undefined,
  nowSeconds = currentActivityTimestamp(),
  timeoutSeconds = getSessionIdleTimeoutSeconds(),
) {
  if (!lastActivityValue) {
    return { active: true, expired: false };
  }

  const lastActivitySeconds = Number.parseInt(lastActivityValue, 10);

  if (!Number.isSafeInteger(lastActivitySeconds) || lastActivitySeconds <= 0) {
    return { active: false, expired: true };
  }

  const idleSeconds = nowSeconds - lastActivitySeconds;

  return {
    active: idleSeconds <= timeoutSeconds,
    expired: idleSeconds > timeoutSeconds,
  };
}

export function touchSessionActivity(
  response: NextResponse,
  nowSeconds = currentActivityTimestamp(),
  timeoutSeconds = getSessionIdleTimeoutSeconds(),
) {
  response.cookies.set(APP_SESSION_ACTIVITY_COOKIE, String(nowSeconds), {
    httpOnly: true,
    maxAge: timeoutSeconds,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export function clearSessionActivity(response: NextResponse) {
  response.cookies.delete(APP_SESSION_ACTIVITY_COOKIE);
}

export async function touchSessionActivityCookieStore() {
  const cookieStore = await cookies();

  cookieStore.set(APP_SESSION_ACTIVITY_COOKIE, String(currentActivityTimestamp()), {
    httpOnly: true,
    maxAge: getSessionIdleTimeoutSeconds(),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSessionActivityCookieStore() {
  const cookieStore = await cookies();

  cookieStore.delete(APP_SESSION_ACTIVITY_COOKIE);
}
