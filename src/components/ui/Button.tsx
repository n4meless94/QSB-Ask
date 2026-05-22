import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "destructive" | "ghost";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const baseClasses =
  "relative inline-flex min-h-11 items-center justify-center rounded-[6px] px-4 text-base font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 sm:min-h-10";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-teal-700 text-white hover:bg-teal-800 focus-visible:ring-teal-700",
  secondary:
    "border border-slate-300 bg-white text-slate-900 hover:bg-slate-100 focus-visible:ring-teal-700",
  destructive: "bg-red-700 text-white hover:bg-red-800 focus-visible:ring-red-700",
  ghost: "text-slate-900 hover:bg-slate-100 focus-visible:ring-teal-700",
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  disabled,
  loading = false,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cx(baseClasses, variantClasses[variant], className)}
      disabled={disabled || loading}
      type={type}
      {...props}
    >
      <span className={loading ? "invisible" : undefined}>{children}</span>
      {loading ? <span className="absolute">Loading</span> : null}
    </button>
  );
}
