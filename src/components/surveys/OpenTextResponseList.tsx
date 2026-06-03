import type { OpenTextResponse } from "@/lib/surveys/results";

type OpenTextResponseListProps = {
  responses: OpenTextResponse[];
  title: string;
};

export function OpenTextResponseList({ responses, title }: OpenTextResponseListProps) {
  return (
    <div className="grid gap-3">
      <h3 className="break-words text-[20px] font-semibold leading-[1.25] text-slate-900">
        {title}
      </h3>
      {responses.length === 0 ? (
        <div className="rounded-[6px] border border-slate-300 bg-white p-3">
          <p className="text-base font-semibold leading-6 text-slate-900">No text responses yet</p>
          <p className="text-sm leading-[1.4] text-slate-600">
            Text responses will appear here after participants submit this survey.
          </p>
        </div>
      ) : (
        <ul aria-label={`${title} responses`} className="grid gap-3">
          {responses.map((response) => (
            <li
              className="grid gap-2 rounded-[6px] border border-slate-300 bg-white p-3"
              key={`${response.label}-${response.submittedAt}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-sm leading-[1.4] text-slate-600">
                <span className="font-semibold text-slate-900">{response.label}</span>
                <time dateTime={response.submittedAt}>
                  {new Date(response.submittedAt).toLocaleString("en-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Asia/Kuala_Lumpur",
                  })}
                </time>
              </div>
              <p className="break-words text-base leading-6 text-slate-900">{response.text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
