import { getRuntimeEnvStatus } from "@/lib/env";

type HealthOptions = {
  now?: Date;
  nodeEnv?: string;
};

export type HealthPayload = {
  ok: boolean;
  service: "qsb-ask";
  status: "ok" | "configuration_missing";
  environment: string;
  configuration: {
    configured: boolean;
    missingKeys: string[];
  };
  timestamp: string;
};

export function buildHealthResponse({ now = new Date(), nodeEnv = process.env.NODE_ENV ?? "development" }: HealthOptions = {}) {
  const envStatus = getRuntimeEnvStatus();
  const productionMissingConfig = nodeEnv === "production" && !envStatus.configured;
  const payload: HealthPayload = {
    ok: !productionMissingConfig,
    service: "qsb-ask",
    status: productionMissingConfig ? "configuration_missing" : "ok",
    environment: nodeEnv,
    configuration: {
      configured: envStatus.configured,
      missingKeys: envStatus.missingKeys,
    },
    timestamp: now.toISOString(),
  };

  return {
    payload,
    status: productionMissingConfig ? 503 : 200,
  };
}
