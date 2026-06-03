import type { ReactNode } from "react";

type AppShellProps = {
  children: ReactNode;
  currentDestination: string;
  accountAction?: ReactNode;
  currentUserLabel?: string;
};

export function AppShell({
  accountAction,
  children,
  currentDestination,
  currentUserLabel = "Local setup",
}: AppShellProps) {
  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)]">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--radius-sm)] focus:bg-[var(--color-surface-raised)] focus:px-4 focus:py-2 focus:text-[var(--color-ink)] focus:ring-2 focus:ring-[var(--color-focus)]"
        href="#main-content"
      >
        Skip to main content
      </a>

      <header className="border-b border-[var(--color-rule)] bg-[var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:min-h-16 sm:px-6 lg:px-10">
          <div className="min-w-0">
            <p className="text-base font-semibold leading-6 text-[var(--color-ink)]">QSB Ask</p>
            <p className="text-sm leading-[1.4] text-[var(--color-ink-muted)]">
              {currentDestination}
            </p>
          </div>
          <div className="text-right text-sm leading-[1.4] text-[var(--color-ink-muted)]">
            <span className="block text-[var(--color-ink)]">{currentUserLabel}</span>
            {accountAction ?? <span>Setup mode</span>}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-10" id="main-content">
        {children}
      </main>
    </div>
  );
}
