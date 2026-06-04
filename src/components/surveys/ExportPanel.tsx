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
  scope: string;
  sensitivity: string;
};

const EXPORT_ROWS: ExportRow[] = [
  {
    description: "Question records, current text, and version history for this event.",
    kind: "questions",
    label: "Questions and versions",
    scope: "Current event",
    sensitivity: "Includes question text history",
  },
  {
    description: "Moderation actions with actor, action, status change, metadata, and timestamp.",
    kind: "moderation",
    label: "Moderation history",
    scope: "Audit trail",
    sensitivity: "Staff action log",
  },
  {
    description: "Survey answers flattened by response and question.",
    kind: "survey-responses",
    label: "Survey responses",
    scope: "Current survey data",
    sensitivity: "May include participant answers",
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
          Download current event records as CSV. Files are generated when you click download.
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
                <dl className="mt-3 grid gap-2 text-sm leading-[1.4] text-slate-700 sm:grid-cols-2">
                  <div>
                    <dt className="font-semibold text-slate-900">Scope</dt>
                    <dd>{row.scope}</dd>
                  </div>
                  <div>
                    <dt className="font-semibold text-slate-900">Export note</dt>
                    <dd>{row.sensitivity}</dd>
                  </div>
                </dl>
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
                  aria-label={`Download ${row.label.toLowerCase()} CSV`}
                  className="inline-flex min-h-11 min-w-36 items-center justify-center rounded-[6px] bg-teal-700 px-4 text-base font-semibold leading-6 !text-white no-underline outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
                  href={`/events/${eventId}/export/${row.kind}`}
                >
                  Download {row.label} CSV
                </a>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
