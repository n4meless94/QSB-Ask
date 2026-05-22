import Link from "next/link";

import { signInAction } from "@/app/(auth)/actions";
import {
  INVALID_CREDENTIALS_MESSAGE,
  LOCKED_ACCOUNT_MESSAGE,
  SESSION_EXPIRED_MESSAGE,
  SIGN_IN_UNAVAILABLE_MESSAGE,
  PASSWORD_RESET_SUCCESS_MESSAGE,
} from "@/lib/auth/messages";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/Field";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const errorMessages: Record<string, { title: string; body: string; variant: "warning" | "destructive" }> = {
  invalid: {
    title: "Sign in failed",
    body: INVALID_CREDENTIALS_MESSAGE,
    variant: "destructive",
  },
  locked: {
    title: "Account temporarily locked",
    body: LOCKED_ACCOUNT_MESSAGE,
    variant: "warning",
  },
  server: {
    title: "Sign in unavailable",
    body: SIGN_IN_UNAVAILABLE_MESSAGE,
    variant: "destructive",
  },
  "session-expired": {
    title: "Session expired",
    body: SESSION_EXPIRED_MESSAGE,
    variant: "warning",
  },
};

function singleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = (await searchParams) ?? {};
  const error = singleParam(params.error ?? params.reason);
  const email = singleParam(params.email) ?? "";
  const resetSuccess = singleParam(params.reset) === "success";
  const errorState = error ? errorMessages[error] : undefined;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <section className="w-full max-w-[420px] rounded-[6px] border border-slate-300 bg-white p-6 sm:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold leading-[1.25] text-slate-900">QSB Ask</h1>
          <p className="mt-2 text-base leading-6 text-slate-600">
            Sign in to manage event Q&amp;A and surveys.
          </p>
        </div>

        <div className="mb-5 grid gap-3">
          {errorState ? (
            <div
              className={`rounded-[6px] border bg-white p-4 ${
                errorState.variant === "warning" ? "border-amber-700" : "border-red-700"
              }`}
              role="alert"
            >
              <p
                className={`text-base font-semibold leading-6 ${
                  errorState.variant === "warning" ? "text-amber-700" : "text-red-700"
                }`}
              >
                {errorState.title}
              </p>
              <div
                autoFocus
                className="mt-1 text-sm leading-[1.4] text-slate-600 outline-none focus-visible:ring-2 focus-visible:ring-teal-700"
                tabIndex={-1}
              >
                {errorState.body}
              </div>
            </div>
          ) : null}
          {resetSuccess ? (
            <Alert title="Password updated">{PASSWORD_RESET_SUCCESS_MESSAGE}</Alert>
          ) : null}
        </div>

        <form action={signInAction} className="grid gap-4">
          <Field
            autoComplete="email"
            defaultValue={email}
            label="Email"
            name="email"
            required
            type="email"
          />
          <Field autoComplete="current-password" label="Password" name="password" required type="password" />
          <Button className="w-full" type="submit">
            Sign in
          </Button>
        </form>

        <p className="mt-5 text-sm leading-[1.4] text-slate-600">
          <Link className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-teal-700" href="/password-reset">
            Forgot password
          </Link>
        </p>
      </section>
    </main>
  );
}
