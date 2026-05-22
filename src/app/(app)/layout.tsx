import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";

import { signOutAction } from "@/app/(auth)/actions";
import { AppShell } from "@/components/shell/AppShell";
import { E2E_AUTH_COOKIE, isE2EAuthEnabled } from "@/lib/auth/e2e";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ProtectedAppLayout({ children }: { children: ReactNode }) {
  const cookieStore = await cookies();
  const user = isE2EAuthEnabled(cookieStore.get(E2E_AUTH_COOKIE)?.value)
    ? { email: "organiser@qsb.com" }
    : await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <AppShell
      currentDestination="Event Dashboard"
      currentUserLabel={user.email ?? "Signed in"}
      accountAction={
        <form action={signOutAction}>
          <button
            className="mt-1 text-sm font-semibold leading-[1.4] text-slate-900 underline outline-none hover:no-underline focus-visible:ring-2 focus-visible:ring-teal-700"
            type="submit"
          >
            Sign out
          </button>
        </form>
      }
    >
      {children}
    </AppShell>
  );
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
