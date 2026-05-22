import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  confirmPasswordResetAction,
  signOutAction,
  signInAction,
  requestPasswordResetAction,
} from "@/app/(auth)/actions";
import { LOCKED_ACCOUNT_MESSAGE, PASSWORD_RESET_CONFIRMATION_MESSAGE } from "@/lib/auth/messages";
import { assertActiveSession, DEFAULT_SESSION_IDLE_TIMEOUT_SECONDS } from "@/lib/auth/session";

const redirectMock = vi.hoisted(() => vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
}));

const getUserMock = vi.hoisted(() => vi.fn());
const signInWithPasswordMock = vi.hoisted(() => vi.fn());
const resetPasswordForEmailMock = vi.hoisted(() => vi.fn());
const updateUserMock = vi.hoisted(() => vi.fn());
const signOutMock = vi.hoisted(() => vi.fn());
const adminFromMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => ({
    get: vi.fn(() => null),
  })),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: getUserMock,
      signInWithPassword: signInWithPasswordMock,
      resetPasswordForEmail: resetPasswordForEmailMock,
      updateUser: updateUserMock,
      signOut: signOutMock,
    },
  })),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: vi.fn(() => ({
    from: adminFromMock,
  })),
}));

function form(values: Record<string, string>) {
  const formData = new FormData();

  for (const [key, value] of Object.entries(values)) {
    formData.set(key, value);
  }

  return formData;
}

function mockFailedAttempts(attempts: string[] = []) {
  const storedAttempts = [...attempts];
  const order = vi.fn(async () => ({
    data: storedAttempts.map((attempted_at) => ({ attempted_at, success: false })),
    error: null,
  }));
  const gte = vi.fn(() => ({ order }));
  const successEq = vi.fn(() => ({ gte }));
  const emailEq = vi.fn(() => ({ eq: successEq }));
  const select = vi.fn(() => ({ eq: emailEq }));
  const insert = vi.fn(async (attempt: { attempted_at: string; success: boolean }) => {
    if (!attempt.success) {
      storedAttempts.unshift(attempt.attempted_at);
    }

    return { error: null };
  });

  adminFromMock.mockReturnValue({
    select,
    insert,
  });
}

describe("auth server actions", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54321";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role";
    process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";
    process.env.APP_JOIN_URL_BASE = "http://localhost:3000/join";
    process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
    vi.clearAllMocks();
    mockFailedAttempts();
    getUserMock.mockResolvedValue({ data: { user: { email: "organiser@qsb.com" } }, error: null });
  });

  it("signs in with Supabase email and password then redirects to dashboard", async () => {
    signInWithPasswordMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });

    await expect(
      signInAction(form({ email: " Organiser@QSB.com ", password: "ValidPass123!" })),
    ).rejects.toThrow("REDIRECT:/dashboard");

    expect(signInWithPasswordMock).toHaveBeenCalledWith({
      email: "organiser@qsb.com",
      password: "ValidPass123!",
    });
  });

  it("keeps the email and clears the password after invalid credentials", async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(
      signInAction(form({ email: "user@example.com", password: "WrongPass123!" })),
    ).rejects.toThrow("REDIRECT:/login?error=invalid&email=user%40example.com");

    expect(redirectMock).toHaveBeenCalledWith("/login?error=invalid&email=user%40example.com");
  });

  it("locks an account after five failed attempts within 15 minutes", async () => {
    const now = Date.now();
    const failedAttempts = Array.from({ length: 4 }, (_, index) =>
      new Date(now - index * 60_000).toISOString(),
    );

    mockFailedAttempts(failedAttempts);
    signInWithPasswordMock.mockResolvedValue({
      data: { user: null },
      error: { message: "Invalid login credentials" },
    });

    await expect(
      signInAction(form({ email: "locked@example.com", password: "WrongPass123!" })),
    ).rejects.toThrow("REDIRECT:/login?error=locked&email=locked%40example.com");

    expect(LOCKED_ACCOUNT_MESSAGE).toBe(
      "This account is temporarily locked after repeated failed attempts. Try again in 30 minutes or reset your password.",
    );
  });

  it("does not reveal whether a password reset email exists", async () => {
    resetPasswordForEmailMock.mockResolvedValue({ data: {}, error: null });

    await expect(
      requestPasswordResetAction(form({ email: "unknown@example.com" })),
    ).rejects.toThrow("REDIRECT:/password-reset?sent=1");

    expect(PASSWORD_RESET_CONFIRMATION_MESSAGE).toBe(
      "If an account exists for that email, a reset link has been sent.",
    );
  });

  it("rejects mismatched password reset confirmation before Supabase update", async () => {
    await expect(
      confirmPasswordResetAction(
        form({ password: "ValidPass123!", confirmPassword: "DifferentPass123!" }),
      ),
    ).rejects.toThrow("REDIRECT:/password-reset/confirm?error=mismatch");

    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("rejects weak password reset confirmation before Supabase update", async () => {
    await expect(
      confirmPasswordResetAction(form({ password: "short", confirmPassword: "short" })),
    ).rejects.toThrow("REDIRECT:/password-reset/confirm?error=weak-password");

    expect(updateUserMock).not.toHaveBeenCalled();
  });

  it("signs out through Supabase and redirects to login", async () => {
    signOutMock.mockResolvedValue({ error: null });

    await expect(signOutAction()).rejects.toThrow("REDIRECT:/login");

    expect(signOutMock).toHaveBeenCalled();
  });

  it("expires app sessions after the configured idle timeout", () => {
    const now = 10_000;

    expect(
      assertActiveSession(String(now - DEFAULT_SESSION_IDLE_TIMEOUT_SECONDS - 1), now).expired,
    ).toBe(true);
    expect(assertActiveSession(String(now - 60), now).active).toBe(true);
  });
});
