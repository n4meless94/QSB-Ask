import { getRuntimeEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const envStatus = getRuntimeEnvStatus();

  return Response.json({
    ok: true,
    service: "qsb-ask",
    environment: process.env.NODE_ENV ?? "development",
    configuration: {
      configured: envStatus.configured,
      missingKeys: envStatus.missingKeys,
    },
    timestamp: new Date().toISOString(),
  });
}
