export default function ParticipantSurveysLoading() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-[860px] gap-7">
        <div className="grid gap-4">
          <div className="h-11 w-80 max-w-full animate-pulse rounded-[12px] bg-slate-200" />
          <div className="h-6 w-full max-w-[620px] animate-pulse rounded-[10px] bg-slate-200" />
          <div className="h-12 w-56 animate-pulse rounded-[16px] bg-slate-200" />
        </div>
        <div className="grid gap-4">
          <div className="h-9 w-44 animate-pulse rounded-[10px] bg-slate-200" />
          <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="grid gap-5">
              {[0, 1, 2].map((item) => (
                <div className="grid gap-3 border-t border-slate-100 pt-5 first:border-t-0 first:pt-0" key={item}>
                  <div className="h-7 w-64 max-w-full animate-pulse rounded-[10px] bg-slate-200" />
                  <div className="grid gap-2">
                    <div className="h-12 animate-pulse rounded-[14px] bg-slate-100" />
                    <div className="h-12 animate-pulse rounded-[14px] bg-slate-100" />
                  </div>
                </div>
              ))}
              <div className="h-11 w-full animate-pulse rounded-[12px] bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
