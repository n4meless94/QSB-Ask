type EnvKey =
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "SUPABASE_SERVICE_ROLE_KEY"
  | "NEXT_PUBLIC_SITE_URL"
  | "APP_SESSION_IDLE_TIMEOUT_SECONDS"
  | "APP_JOIN_URL_BASE";

export type AppRuntimeEnv = {
  nextPublicSupabaseUrl: string;
  nextPublicSupabaseAnonKey: string;
  supabaseServiceRoleKey: string;
  nextPublicSiteUrl: string;
  appSessionIdleTimeoutSeconds: number;
  appJoinUrlBase: string;
};

const REQUIRED_KEYS: EnvKey[] = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_SITE_URL",
  "APP_SESSION_IDLE_TIMEOUT_SECONDS",
  "APP_JOIN_URL_BASE",
];

function readEnvValue(key: EnvKey) {
  return process.env[key]?.trim() ?? "";
}

function getMissingEnvKeys() {
  return REQUIRED_KEYS.filter((key) => readEnvValue(key).length === 0);
}

function parsePositiveInteger(key: EnvKey) {
  const rawValue = readEnvValue(key);
  const parsed = Number.parseInt(rawValue, 10);

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`Invalid environment variable: ${key} must be a positive integer.`);
  }

  return parsed;
}

export function getRuntimeEnv(): AppRuntimeEnv {
  if (typeof window !== "undefined") {
    throw new Error("Server runtime environment cannot be read in the browser.");
  }

  const missingKeys = getMissingEnvKeys();
  if (missingKeys.length > 0) {
    throw new Error(`Missing required environment variables: ${missingKeys.join(", ")}`);
  }

  return {
    nextPublicSupabaseUrl: readEnvValue("NEXT_PUBLIC_SUPABASE_URL"),
    nextPublicSupabaseAnonKey: readEnvValue("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: readEnvValue("SUPABASE_SERVICE_ROLE_KEY"),
    nextPublicSiteUrl: readEnvValue("NEXT_PUBLIC_SITE_URL"),
    appSessionIdleTimeoutSeconds: parsePositiveInteger("APP_SESSION_IDLE_TIMEOUT_SECONDS"),
    appJoinUrlBase: readEnvValue("APP_JOIN_URL_BASE"),
  };
}

export function getRuntimeEnvStatus() {
  const missingKeys = getMissingEnvKeys();

  return {
    configured: missingKeys.length === 0,
    missingKeys,
  };
}
