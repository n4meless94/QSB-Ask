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
    <section
      aria-labelledby="moderation-history-heading"
      className="grid gap-3 rounded-[6px] border border-slate-300 bg-white p-4 sm:p-6"
    >
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

      {history.length === 0 ? (
        <p className="rounded-[6px] border border-slate-300 bg-white p-3 text-sm leading-[1.4] text-slate-600">
          No moderation actions recorded yet.
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
    </section>
  );
}
