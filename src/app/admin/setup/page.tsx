import Link from "next/link";

import { AppShell } from "@/components/shell/AppShell";
import { getRuntimeEnvStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

const setupLinks = [
  {
    label: "Organiser login",
    href: "/login",
    body: "Confirm the sign-in destination after runtime configuration is complete.",
  },
  {
    label: "Health JSON",
    href: "/admin/health",
    body: "Inspect non-secret runtime health for operators and deployment checks.",
  },
];

export default function AdminSetupPage() {
  const envStatus = getRuntimeEnvStatus();
  const missingCount = envStatus.missingKeys.length;

  return (
    <AppShell currentDestination="Admin setup" currentUserLabel="System diagnostics">
      <div className="grid gap-8">
        <section className="grid gap-6 border-b border-[var(--color-rule)] pb-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div className="min-w-0">
            <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-accent-strong)]">
              Operator setup
            </p>
            <h1 className="hallmark-display-heading mt-3 max-w-3xl text-[var(--color-ink)]">
              QSB Ask setup status.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--color-ink-muted)]">
              Runtime diagnostics live here so the public homepage can stay focused on
              event joining and product flow.
            </p>
          </div>

          <div
            className={`rounded-[var(--radius-md)] border p-5 ${
              envStatus.configured
                ? "border-[var(--color-success)] bg-[var(--color-success-soft)]"
                : "border-[var(--color-warning)] bg-[var(--color-warning-soft)]"
            }`}
          >
            <p className="text-sm font-semibold uppercase leading-[1.4] tracking-[0] text-[var(--color-ink-muted)]">
              Configuration
            </p>
            <h2 className="mt-4 text-2xl font-semibold leading-tight text-[var(--color-ink)]">
              {envStatus.configured
                ? "All required keys are present"
                : `${missingCount} setup ${missingCount === 1 ? "item" : "items"} missing`}
            </h2>
            <p className="mt-3 text-base leading-7 text-[var(--color-ink-muted)]">
              {envStatus.configured
                ? "Continue to organiser sign-in or inspect the health endpoint."
                : "Add the missing environment variables, then restart the app."}
            </p>
          </div>
        </section>

        {!envStatus.configured ? (
          <section
            aria-labelledby="missing-keys-heading"
            className="rounded-[var(--radius-md)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] p-5"
          >
            <h2 id="missing-keys-heading" className="text-xl font-semibold leading-tight">
              Missing environment keys
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {envStatus.missingKeys.map((key) => (
                <code
                  className="rounded-[var(--radius-xs)] border border-[var(--color-warning)] bg-[var(--color-surface-raised)] px-2 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-ink)]"
                  key={key}
                >
                  {key}
                </code>
              ))}
            </div>
          </section>
        ) : null}

        <section
          aria-labelledby="setup-actions-heading"
          className="grid gap-4 sm:grid-cols-2"
        >
          <h2 id="setup-actions-heading" className="sr-only">
            Setup actions
          </h2>
          {setupLinks.map((link) => (
            <article
              className="rounded-[var(--radius-md)] border border-[var(--color-rule)] bg-[var(--color-surface-raised)] p-5 shadow-[var(--shadow-panel)]"
              key={link.href}
            >
              <h3 className="text-xl font-semibold leading-tight">{link.label}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--color-ink-muted)]">
                {link.body}
              </p>
              <Link className="foundation-utility-link mt-4" href={link.href}>
                Open {link.label.toLowerCase()}
              </Link>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
