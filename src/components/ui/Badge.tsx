import type { EventStatus } from "@/types/app";

type BadgeTone = EventStatus | "neutral";

type BadgeProps = {
  children: string;
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  draft: "border-slate-300 bg-white text-slate-700",
  active: "border-teal-700 bg-white text-teal-700",
  ended: "border-slate-500 bg-white text-slate-700",
  archived: "border-slate-400 bg-slate-100 text-slate-700",
  neutral: "border-slate-300 bg-white text-slate-700",
};

export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-[6px] border px-2 py-1 text-sm font-semibold leading-[1.4] ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
