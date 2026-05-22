import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getRuntimeEnv } from "@/lib/env";

import type { Database } from "./database.types";

export function createSupabaseAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error("Supabase admin client cannot be created in the browser.");
  }

  const env = getRuntimeEnv();

  return createClient<Database>(env.nextPublicSupabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
