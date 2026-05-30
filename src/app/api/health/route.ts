import { buildHealthResponse } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  const { payload, status } = buildHealthResponse();

  return Response.json(payload, { status });
}
