import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";

type PublicSupabaseConfig = {
  supabaseAnonKey?: string;
  supabaseUrl?: string;
};

declare global {
  interface Window {
    __QSB_ASK_PUBLIC_CONFIG__?: PublicSupabaseConfig;
  }
}

function getPublicSupabaseConfig() {
  const runtimeConfig =
    typeof window === "undefined" ? undefined : window.__QSB_ASK_PUBLIC_CONFIG__;
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || runtimeConfig?.supabaseUrl?.trim();
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || runtimeConfig?.supabaseAnonKey?.trim();

  return {
    supabaseAnonKey,
    supabaseUrl,
  };
}

export function createSupabaseBrowserClient() {
  const { supabaseAnonKey, supabaseUrl } = getPublicSupabaseConfig();

  return createBrowserClient<Database>(supabaseUrl!, supabaseAnonKey!);
}
