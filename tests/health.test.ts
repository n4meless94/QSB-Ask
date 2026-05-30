import { afterEach, describe, expect, test } from "vitest";

import { buildHealthResponse } from "@/lib/health";

const REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "APP_JOIN_URL_BASE",
  "APP_SESSION_IDLE_TIMEOUT_SECONDS",
] as const;

const originalEnv = { ...process.env };

function clearRequiredEnv() {
  for (const key of REQUIRED_ENV) {
    delete process.env[key];
  }
}

function setRequiredEnv() {
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-secret-value";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret-value";
  process.env.NEXT_PUBLIC_SITE_URL = "https://ask.qsbportal.com.my";
  process.env.APP_JOIN_URL_BASE = "https://ask.qsbportal.com.my/join";
  process.env.APP_SESSION_IDLE_TIMEOUT_SECONDS = "28800";
}

describe("health response", () => {
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test("keeps local health reachable when configuration is incomplete", () => {
    clearRequiredEnv();

    const response = buildHealthResponse({
      nodeEnv: "development",
      now: new Date("2026-05-30T00:00:00.000Z"),
    });

    expect(response.status).toBe(200);
    expect(response.payload).toMatchObject({
      ok: true,
      service: "qsb-ask",
      status: "ok",
      configuration: {
        configured: false,
      },
    });
    expect(response.payload.configuration.missingKeys).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  test("fails production readiness when required configuration is missing", () => {
    clearRequiredEnv();

    const response = buildHealthResponse({
      nodeEnv: "production",
      now: new Date("2026-05-30T00:00:00.000Z"),
    });

    expect(response.status).toBe(503);
    expect(response.payload.ok).toBe(false);
    expect(response.payload.status).toBe("configuration_missing");
    expect(response.payload.configuration.missingKeys).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  test("reports key names but never secret values", () => {
    setRequiredEnv();

    const response = buildHealthResponse({
      nodeEnv: "production",
      now: new Date("2026-05-30T00:00:00.000Z"),
    });
    const serialized = JSON.stringify(response.payload);

    expect(response.status).toBe(200);
    expect(response.payload.ok).toBe(true);
    expect(serialized).not.toContain("anon-secret-value");
    expect(serialized).not.toContain("service-role-secret-value");
    expect(serialized).not.toContain("replace-with-supabase-service-role-key");
  });
});
