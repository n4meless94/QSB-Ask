import type { InputHTMLAttributes } from "react";

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
};

function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function Field({ className, error, helperText, id, label, ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  const helperId = helperText && fieldId ? `${fieldId}-helper` : undefined;
  const errorId = error && fieldId ? `${fieldId}-error` : undefined;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold leading-[1.4] text-slate-900" htmlFor={fieldId}>
        {label}
      </label>
      <input
        aria-describedby={[helperId, errorId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? "true" : undefined}
        className={cx(
          "min-h-11 rounded-[6px] border border-slate-300 bg-white px-3 text-base leading-6 text-slate-900 outline-none focus:border-teal-700 focus:ring-2 focus:ring-teal-700 focus:ring-offset-2 sm:min-h-10",
          error && "border-red-700",
          className,
        )}
        id={fieldId}
        {...props}
      />
      {helperText ? (
        <p className="text-sm leading-[1.4] text-slate-600" id={helperId}>
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm font-semibold leading-[1.4] text-red-700" id={errorId}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
