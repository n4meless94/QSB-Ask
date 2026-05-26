import type { QnaConnectionState } from "@/lib/qna/realtime";

type ConnectionStatusProps = {
  state: QnaConnectionState;
};

const copy: Record<QnaConnectionState, string> = {
  live: "Connected",
  reconnecting: "Reconnecting",
  "refresh-needed": "Refresh needed",
};

export function ConnectionStatus({ state }: ConnectionStatusProps) {
  const tone =
    state === "live"
      ? "border-teal-700 text-teal-700"
      : state === "reconnecting"
        ? "border-amber-700 text-amber-700"
        : "border-red-700 text-red-700";

  return (
    <p
      aria-live="polite"
      className={`w-fit rounded-[6px] border bg-white px-2 py-1 text-sm font-semibold leading-[1.4] ${tone}`}
    >
      {copy[state]}
    </p>
  );
}
