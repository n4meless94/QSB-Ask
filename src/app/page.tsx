import { AppShell } from "@/components/shell/AppShell";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Field } from "@/components/ui/Field";
import { getRuntimeEnvStatus } from "@/lib/env";

export default function Home() {
  const envStatus = getRuntimeEnvStatus();

  return (
    <AppShell currentDestination="Foundation" currentUserLabel="Environment setup">
      <div className="grid gap-6">
        <div className="flex flex-col justify-between gap-4 border-b border-slate-300 pb-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm leading-[1.4] text-slate-600">Phase 1 foundation</p>
            <h1 className="mt-1 text-[28px] font-semibold leading-[1.2] text-slate-900">
              Event operations
            </h1>
          </div>
          <Badge tone={envStatus.configured ? "active" : "draft"}>
            {envStatus.configured ? "Configured" : "Configuration needed"}
          </Badge>
        </div>

        {!envStatus.configured ? (
          <Alert title="Local configuration is incomplete" variant="warning">
            Add the missing environment variables and restart the app.
          </Alert>
        ) : null}

        <section
          aria-labelledby="setup-heading"
          className="grid gap-4 rounded-[6px] border border-slate-300 bg-white p-4"
        >
          <div>
            <h2 id="setup-heading" className="text-xl font-semibold leading-tight text-slate-900">
              Local setup status
            </h2>
            <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">
              Supabase configuration is required before organiser sign-in.
            </p>
          </div>

          <Field
            helperText="Phase 1 auth route target."
            label="Auth route"
            name="next-destination"
            readOnly
            value="/login"
          />

          <div className="flex flex-wrap gap-3">
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] bg-teal-700 px-4 text-base font-semibold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href="/login"
            >
              Go to sign in
            </a>
            <a
              className="inline-flex min-h-11 items-center justify-center rounded-[6px] border border-slate-300 bg-white px-4 text-base font-semibold text-slate-900 outline-none hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
              href="/api/health"
            >
              Health JSON
            </a>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
