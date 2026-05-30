import { Alert } from "@/components/ui/Alert";
import type { ExportCounts, ExportKind } from "@/lib/surveys/export";

type ExportPanelProps = {
  counts: ExportCounts;
  eventId: string;
};

type ExportRow = {
  description: string;
  kind: ExportKind;
  label: string;
};

const EXPORT_ROWS: ExportRow[] = [
  {
    description: "Question records, current text, and version history for this event.",
    kind: "questions",
    label: "Questions and versions",
  },
  {
    description: "Moderation actions with actor, action, status change, metadata, and timestamp.",
    kind: "moderation",
    label: "Moderation history",
  },
  {
    description: "Survey answers flattened by response and question.",
    kind: "survey-responses",
    label: "Survey responses",
  },
];

function recordLabel(count: number) {
  return `${count} ${count === 1 ? "record" : "records"}`;
}

export function ExportPanel({ counts, eventId }: ExportPanelProps) {
  return (
    <section
      aria-labelledby="csv-exports-heading"
      className="grid gap-5 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
    >
      <div className="grid gap-1">
        <h2
          className="text-[20px] font-semibold leading-[1.25] text-slate-900"
          id="csv-exports-heading"
        >
          CSV exports
        </h2>
        <p className="text-sm leading-[1.4] text-slate-600">
          Download event-level CSV records for approved export categories.
        </p>
      </div>

      <div className="grid gap-3">
        {EXPORT_ROWS.map((row) => {
          const count = counts[row.kind];
          const hasRecords = count > 0;

          return (
            <div
              aria-label={row.label}
              className="grid gap-3 rounded-[6px] border border-slate-300 p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
              key={row.kind}
              role="group"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold leading-6 text-slate-900">{row.label}</h3>
                  <span className="rounded-[6px] border border-slate-300 px-2 py-1 text-sm font-semibold leading-[1.4] text-slate-700">
                    {recordLabel(count)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-[1.4] text-slate-600">{row.description}</p>
                {!hasRecords ? (
                  <div className="mt-3">
                    <Alert title="No records to export" variant="warning">
                      This CSV will be available after records exist for this event.
                    </Alert>
                  </div>
                ) : null}
              </div>

              {hasRecords ? (
                <a
                  className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-[6px] bg-teal-700 px-4 text-base font-semibold leading-6 text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
                  href={`/events/${eventId}/export/${row.kind}`}
                >
                  Download CSV
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
