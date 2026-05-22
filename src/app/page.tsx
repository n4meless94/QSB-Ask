export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">
      <header className="border-b border-slate-300 pb-4">
        <p className="text-sm font-semibold text-slate-600">QSB Ask</p>
        <h1 className="mt-2 text-[28px] font-semibold leading-[1.2] text-slate-900">
          Event operations
        </h1>
      </header>

      <section
        aria-labelledby="foundation-status"
        className="rounded-[6px] border border-slate-300 bg-white p-4"
      >
        <h2 id="foundation-status" className="text-xl font-semibold leading-tight text-slate-900">
          Foundation ready
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-6 text-slate-600">
          Configure Supabase, sign in, and manage controlled event Q&A and surveys from the
          organiser workspace.
        </p>
        <a
          className="mt-4 inline-flex min-h-11 items-center rounded-[6px] bg-teal-700 px-4 text-base font-semibold text-white outline-none hover:bg-teal-800 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 sm:min-h-10"
          href="/auth/sign-in"
        >
          Go to sign in
        </a>
      </section>
    </main>
  );
}
