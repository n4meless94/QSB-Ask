import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getRuntimeEnv } from "@/lib/env";

import type { Database } from "./database.types";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const env = getRuntimeEnv();

  return createServerClient<Database>(env.nextPublicSupabaseUrl, env.nextPublicSupabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies; Route Handlers and Server Actions can.
        }
      },
    },
  });
}
