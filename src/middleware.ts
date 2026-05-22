import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getRuntimeEnvStatus } from "@/lib/env";
import {
  APP_SESSION_ACTIVITY_COOKIE,
  assertActiveSession,
  clearSessionActivity,
  getSessionIdleTimeoutSeconds,
  touchSessionActivity,
} from "@/lib/auth/session";
import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
import type { Database } from "@/lib/supabase/database.types";

export const APP_SESSION_IDLE_TIMEOUT_SECONDS = getSessionIdleTimeoutSeconds();

const protectedPrefixes = ["/dashboard", "/events"];
const authPrefixes = ["/login", "/password-reset"];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPath(pathname: string) {
  return authPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function redirectWithClearedSession(request: NextRequest) {
  const redirectResponse = NextResponse.redirect(new URL("/login?reason=session-expired", request.url));

  clearSessionActivity(redirectResponse);

  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith("sb-")) {
      redirectResponse.cookies.delete(cookie.name);
    }
  }

  return redirectResponse;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (!isProtectedPath(pathname) && !isAuthPath(pathname)) {
    return NextResponse.next();
  }

  if (isE2EAuthEnabled(request.cookies.get(E2E_AUTH_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const envStatus = getRuntimeEnvStatus();

  if (!envStatus.configured) {
    if (isProtectedPath(pathname)) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    return NextResponse.next();
  }

  const response = NextResponse.next({ request });
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isProtectedPath(pathname)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthPath(pathname) && !pathname.startsWith("/password-reset/confirm")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (user && isProtectedPath(pathname)) {
    const lastActivity = request.cookies.get(APP_SESSION_ACTIVITY_COOKIE)?.value;
    const sessionState = assertActiveSession(lastActivity);

    if (sessionState.expired) {
      await supabase.auth.signOut();
      return redirectWithClearedSession(request);
    }

    touchSessionActivity(response);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/events/:path*", "/login", "/password-reset/:path*"],
};
