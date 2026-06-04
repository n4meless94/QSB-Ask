import type { ModerationHistoryEntry } from "@/lib/qna/moderation-shared";

type ModerationHistoryPanelProps = {
  history: ModerationHistoryEntry[];
};

function actionLabel(entry: ModerationHistoryEntry) {
  const fromStatus = entry.from_status ?? "none";
  const toStatus = entry.to_status ?? "none";

  return `${entry.action}: ${fromStatus} to ${toStatus}`;
}

export function ModerationHistoryPanel({ history }: ModerationHistoryPanelProps) {
  return (
    <details className="rounded-[6px] border border-slate-300 bg-white p-4 sm:p-5">
      <summary className="cursor-pointer list-none outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2">
        <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
          <div className="grid gap-1">
            <h3
              className="text-[20px] font-semibold leading-[1.25] text-slate-900"
              id="moderation-history-heading"
            >
              Moderation history
            </h3>
            <p className="text-sm leading-[1.4] text-slate-600">
              Staff-only audit trail for recent question actions and edits.
            </p>
          </div>
          <p className="rounded-[6px] border border-slate-300 bg-slate-50 px-3 py-2 text-sm font-semibold leading-[1.4] text-slate-700">
            {history.length} recorded
          </p>
        </div>
      </summary>

      <div className="mt-3 grid gap-3" aria-labelledby="moderation-history-heading">
        {history.length === 0 ? (
          <p className="rounded-[6px] border border-slate-300 bg-slate-50 p-3 text-sm leading-[1.4] text-slate-600">
            No actions recorded yet. Approvals, edits, dismissals, and archive actions will appear here.
          </p>
        ) : (
          <ul className="grid gap-2" aria-label="Moderation action history">
            {history.map((entry) => (
              <li
                className="grid gap-1 rounded-[6px] border border-slate-300 bg-white p-3 text-sm leading-[1.4]"
                key={entry.id}
              >
                <p className="font-semibold text-slate-900">{actionLabel(entry)}</p>
                <p className="break-words text-slate-600">
                  Question {entry.question_id} by {entry.actor_user_id}
                </p>
                <time className="text-slate-600" dateTime={entry.created_at}>
                  {new Date(entry.created_at).toLocaleString("en-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kuala_Lumpur",
                  })}
                </time>
              </li>
            ))}
          </ul>
        )}
      </div>
    </details>
  );
}
