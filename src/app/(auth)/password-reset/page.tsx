import Link from "next/link";

import { requestPasswordResetAction } from "@/app/(auth)/actions";
import {
  PASSWORD_RESET_CONFIRMATION_MESSAGE,
  PASSWORD_RESET_ERROR_MESSAGE,
} from "@/lib/auth/messages";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type PasswordResetPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  const params = (await searchParams) ?? {};
  const sent = singleParam(params.sent) === "1";
  const error = singleParam(params.error) === "reset";
  const email = singleParam(params.email) ?? "";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-[420px] rounded-[6px] border border-slate-300 bg-white p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold leading-[1.25] text-slate-900">Reset password</h1>
          <p className="mt-2 text-base leading-6 text-slate-600">
            Send a password reset link to your organiser email.
          </p>
        </div>

        <div className="mb-5 grid gap-3">
          {sent ? <Alert title="Reset link sent">{PASSWORD_RESET_CONFIRMATION_MESSAGE}</Alert> : null}
          {error ? (
            <Alert title="Reset link unavailable" variant="destructive">
              {PASSWORD_RESET_ERROR_MESSAGE}
            </Alert>
          ) : null}
        </div>

        <form action={requestPasswordResetAction} className="grid gap-4">
          <Field autoComplete="email" defaultValue={email} label="Email" name="email" required type="email" />
          <Button className="w-full" type="submit">
            Send reset link
          </Button>
        </form>

        <p className="mt-5 text-sm leading-[1.4] text-slate-600">
          <Link className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-teal-700" href="/login">
            Back to sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
