import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getExportCsv, isExportKind } from "@/lib/surveys/export";

type ExportRouteContext = {
  params: Promise<{
    eventId: string;
    kind: string;
  }>;
};

export async function GET(_request: Request, context: ExportRouteContext) {
  const { eventId, kind } = await context.params;

  if (!isExportKind(kind)) {
    return new Response("Export type not found.", { status: 404 });
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return new Response("You do not have access to this export.", { status: 401 });
  }

  try {
    const payload = await getExportCsv(user.id, eventId, kind);

    if (payload.rows.length === 0) {
      return new Response(null, {
        headers: {
          "Cache-Control": "no-store",
        },
        status: 204,
      });
    }

    return new Response(payload.csv, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${payload.filename}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
      status: 200,
    });
  } catch (exportError) {
    const message = exportError instanceof Error ? exportError.message : "";
    const isAccessError = /access|organiser|signed-in/i.test(message);

    return new Response(
      isAccessError ? "Only organisers can export event records." : "CSV export could not be generated. Try again.",
      { status: isAccessError ? 403 : 500 },
    );
  }
}
