import "server-only";

import { Buffer } from "node:buffer";

import type { User } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

import { getRuntimeEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const BASE64_COOKIE_PREFIX = "base64-";

function authCookieName() {
  const { hostname } = new URL(getRuntimeEnv().nextPublicSupabaseUrl);
  const projectRef = hostname.split(".")[0];

  return `sb-${projectRef}-auth-token`;
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8");
}

function combineCookieChunks(
  allCookies: Array<{ name: string; value: string }>,
  baseName: string,
) {
  const directCookie = allCookies.find((cookie) => cookie.name === baseName);

  if (directCookie?.value) return directCookie.value;

  const chunks: string[] = [];

  for (let index = 0; ; index += 1) {
    const chunk = allCookies.find((cookie) => cookie.name === `${baseName}.${index}`);

    if (!chunk?.value) break;
    chunks.push(chunk.value);
  }

  return chunks.length > 0 ? chunks.join("") : null;
}

function parseCookieHeader(cookieHeader: string | null) {
  if (!cookieHeader) return [];

  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf("=");

      if (separatorIndex === -1) {
        return { name: part, value: "" };
      }

      return {
        name: part.slice(0, separatorIndex),
        value: decodeURIComponent(part.slice(separatorIndex + 1)),
      };
    });
}

async function getRequestCookies() {
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authName = authCookieName();

  if (allCookies.some((cookie) => cookie.name === authName || cookie.name.startsWith(`${authName}.`))) {
    return allCookies;
  }

  const headerStore = await headers();

  return parseCookieHeader(headerStore.get("cookie"));
}

function parseAccessToken(cookieValue: string | null) {
  if (!cookieValue) return null;

  const rawSession = cookieValue.startsWith(BASE64_COOKIE_PREFIX)
    ? decodeBase64Url(cookieValue.slice(BASE64_COOKIE_PREFIX.length))
    : cookieValue;
  const session = JSON.parse(rawSession) as { access_token?: unknown } | unknown[];

  if (Array.isArray(session)) {
    const [accessToken] = session;
    return typeof accessToken === "string" ? accessToken : null;
  }

  return typeof session.access_token === "string" ? session.access_token : null;
}

async function getUserFromAuthCookie() {
  try {
    const allCookies = await getRequestCookies();
    const accessToken = parseAccessToken(
      combineCookieChunks(allCookies, authCookieName()),
    );

    if (!accessToken) return null;

    const admin = createSupabaseAdminClient();
    const {
      data: { user },
      error,
    } = await admin.auth.getUser(accessToken);

    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) return user;

  return getUserFromAuthCookie();
}
