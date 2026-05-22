import Link from "next/link";

import { confirmPasswordResetAction } from "@/app/(auth)/actions";
import { PASSWORD_RESET_EXPIRED_MESSAGE } from "@/lib/auth/messages";
import { PASSWORD_REQUIREMENTS_MESSAGE } from "@/lib/auth/validation";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type PasswordResetConfirmPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function errorCopy(error: string | undefined) {
  if (error === "mismatch") {
    return "Passwords must match.";
  }

  if (error === "weak-password") {
    return PASSWORD_REQUIREMENTS_MESSAGE;
  }

  if (error === "expired") {
    return PASSWORD_RESET_EXPIRED_MESSAGE;
  }

  return null;
}

export default async function PasswordResetConfirmPage({
  searchParams,
}: PasswordResetConfirmPageProps) {
  const params = (await searchParams) ?? {};
  const error = singleParam(params.error);
  const message = errorCopy(error);
  const expired = error === "expired";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-[420px] rounded-[6px] border border-slate-300 bg-white p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold leading-[1.25] text-slate-900">
            Save new password
          </h1>
          <p className="mt-2 text-base leading-6 text-slate-600">
            Use a password that meets the organiser account requirements.
          </p>
        </div>

        {message ? (
          <div className="mb-5" tabIndex={-1}>
            <Alert title={expired ? "Reset link expired" : "Password validation"} variant="destructive">
              {message}
            </Alert>
          </div>
        ) : null}

        {expired ? (
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-teal-700 px-4 text-base font-semibold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
            href="/password-reset"
          >
            Request a new reset link
          </Link>
        ) : (
          <form action={confirmPasswordResetAction} className="grid gap-4">
            <Field
              autoComplete="new-password"
              helperText={PASSWORD_REQUIREMENTS_MESSAGE}
              label="New password"
              name="password"
              required
              type="password"
            />
            <Field
              autoComplete="new-password"
              label="Confirm password"
              name="confirmPassword"
              required
              type="password"
            />
            <Button className="w-full" type="submit">
              Save new password
            </Button>
          </form>
        )}
      </section>
    </main>
  );
}
