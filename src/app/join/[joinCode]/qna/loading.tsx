export default function ParticipantQnaLoading() {
  return (
    <main className="min-h-screen bg-[#F6F8FB] px-4 py-8 text-slate-900 sm:px-6 sm:py-10">
      <div className="mx-auto grid max-w-[860px] gap-7">
        <div className="grid gap-4">
          <div className="h-11 w-72 max-w-full animate-pulse rounded-[12px] bg-slate-200" />
          <div className="h-6 w-full max-w-[620px] animate-pulse rounded-[10px] bg-slate-200" />
          <div className="h-12 w-56 animate-pulse rounded-[16px] bg-slate-200" />
        </div>
        <div className="rounded-[16px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="grid gap-4">
            <div className="h-8 w-48 animate-pulse rounded-[10px] bg-slate-200" />
            <div className="h-36 animate-pulse rounded-[14px] bg-slate-100" />
            <div className="flex justify-between gap-4">
              <div className="h-6 w-20 animate-pulse rounded-[10px] bg-slate-200" />
              <div className="h-11 w-40 animate-pulse rounded-[12px] bg-slate-200" />
            </div>
          </div>
        </div>
        <div className="grid gap-3">
          <div className="h-9 w-40 animate-pulse rounded-[10px] bg-slate-200" />
          {[0, 1, 2].map((item) => (
            <div
              className="grid grid-cols-[auto_minmax(0,1fr)] gap-4 rounded-[16px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              key={item}
            >
              <div className="h-[76px] w-16 animate-pulse rounded-[12px] bg-slate-100" />
              <div className="grid content-center gap-3">
                <div className="h-5 w-28 animate-pulse rounded-full bg-slate-100" />
                <div className="h-7 w-full max-w-[520px] animate-pulse rounded-[10px] bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
