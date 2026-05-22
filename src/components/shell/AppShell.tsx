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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[6px] focus:bg-white focus:px-4 focus:py-2 focus:text-slate-900 focus:ring-2 focus:ring-teal-700"
        href="#main-content"
      >
        Skip to main content
      </a>

      <header className="border-b border-slate-300 bg-white">
        <div className="mx-auto flex min-h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:min-h-16 sm:px-6 lg:px-10">
          <div className="min-w-0">
            <p className="text-base font-semibold leading-6 text-slate-900">QSB Ask</p>
            <p className="text-sm leading-[1.4] text-slate-600">{currentDestination}</p>
          </div>
          <div className="text-right text-sm leading-[1.4] text-slate-600">
            <span className="block text-slate-900">{currentUserLabel}</span>
            {accountAction ?? <span>Setup mode</span>}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-10" id="main-content">
        {children}
      </main>
    </div>
  );
}
