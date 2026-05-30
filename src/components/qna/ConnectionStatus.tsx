import type { QnaConnectionState } from "@/lib/qna/realtime";

type ConnectionStatusProps = {
  onRefresh?: () => void;
  state: QnaConnectionState;
};

const copy: Record<QnaConnectionState, string> = {
  live: "Connected",
  reconnecting: "Reconnecting. Live updates may be delayed.",
  offline: "You are offline. Live updates will resume when the connection returns.",
  "refresh-needed": "Live updates are not reconnecting. Refresh this view to continue.",
};

export function ConnectionStatus({ onRefresh, state }: ConnectionStatusProps) {
  const tone =
    state === "live"
      ? "border-teal-700 text-teal-700"
      : state === "reconnecting" || state === "offline"
        ? "border-amber-700 text-amber-700"
        : "border-red-700 text-red-700";

  return (
    <div
      className={`flex w-fit max-w-full flex-wrap items-center gap-2 rounded-[6px] border bg-white px-3 py-2 text-sm font-semibold leading-[1.4] ${tone}`}
    >
      <p aria-live="polite">{copy[state]}</p>
      {state === "refresh-needed" && onRefresh ? (
        <button
          className="min-h-10 rounded-[6px] border border-current bg-white px-3 text-sm font-semibold leading-[1.4] outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          onClick={onRefresh}
          type="button"
        >
          Refresh view
        </button>
      ) : null}
    </div>
  );
}
