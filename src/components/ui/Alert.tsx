import type { ReactNode } from "react";

type AlertVariant = "info" | "warning" | "destructive";

type AlertProps = {
  title: string;
  children: ReactNode;
  variant?: AlertVariant;
};

const variantClasses: Record<AlertVariant, string> = {
  info: "border-slate-300 bg-white text-slate-900",
  warning: "border-amber-700 bg-white text-slate-900",
  destructive: "border-red-700 bg-white text-slate-900",
};

const titleClasses: Record<AlertVariant, string> = {
  info: "text-slate-900",
  warning: "text-amber-700",
  destructive: "text-red-700",
};

export function Alert({ children, title, variant = "info" }: AlertProps) {
  return (
    <div className={`rounded-[6px] border p-4 ${variantClasses[variant]}`} role="status">
      <p className={`text-base font-semibold leading-6 ${titleClasses[variant]}`}>{title}</p>
      <div className="mt-1 text-sm leading-[1.4] text-slate-600">{children}</div>
    </div>
  );
}
