"use client";

import { useMemo } from "react";

import type { SurveyChartDatum } from "@/lib/surveys/results";

type SurveyBarChartProps = {
  data: SurveyChartDatum[];
  title: string;
};

function responseCopy(count: number) {
  return `${count} ${count === 1 ? "response" : "responses"}`;
}

function labelCopy(datum: SurveyChartDatum) {
  return `${datum.label}: ${responseCopy(datum.count)}, ${datum.percentage}%`;
}

export function SurveyBarChart({ data, title }: SurveyBarChartProps) {
  const { maxPercentage, summaryItems, total } = useMemo(() => {
    return {
      maxPercentage: data.reduce((highest, datum) => Math.max(highest, datum.percentage), 1),
      summaryItems: data.map((datum) => labelCopy(datum)),
      total: data.reduce((sum, datum) => sum + datum.count, 0),
    };
  }, [data]);
  const hasResponses = total > 0;
  const hasLowResponses = total > 0 && total < 5;

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <h3 className="break-words text-[20px] font-semibold leading-[1.25] text-slate-900">
          {title}
        </h3>
        {!hasResponses ? (
          <div className="rounded-[6px] border border-amber-700 bg-white p-3 text-sm leading-[1.4] text-slate-700">
            <p className="font-semibold text-amber-700">No responses yet</p>
            <p>Charts will update when participants submit this survey.</p>
          </div>
        ) : null}
        {hasLowResponses ? (
          <div className="rounded-[6px] border border-teal-700 bg-teal-50 p-3 text-sm leading-[1.4] text-teal-900">
            <p className="font-semibold">Early signal</p>
            <p>{responseCopy(total)} so percentages may change quickly as more participants answer.</p>
          </div>
        ) : null}
      </div>

      <div aria-label={`${title} chart`} className="grid gap-3 rounded-[6px] border border-slate-200 bg-slate-50 p-3" role="img">
        {data.map((datum) => {
          const barWidth = hasResponses && datum.count > 0 ? Math.max((datum.percentage / maxPercentage) * 100, 4) : 0;

          return (
            <div className="grid min-w-0 gap-2" key={datum.label}>
              <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <p className="min-w-0 break-words text-sm font-semibold leading-[1.35] text-slate-900">
                  {datum.label}
                </p>
                <p className="font-mono text-sm font-semibold leading-[1.35] tracking-normal text-slate-700">
                  {responseCopy(datum.count)}, {datum.percentage}%
                </p>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.45)]">
                <div
                  aria-hidden="true"
                  className="h-full rounded-full bg-teal-700"
                  style={{ width: `${barWidth}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <ul className="grid gap-2 text-sm leading-[1.4] text-slate-700">
        {data.map((datum, index) => (
          <li className="break-words" key={datum.label}>
            {summaryItems[index]}
          </li>
        ))}
      </ul>

      <div className="overflow-x-auto">
        <table
          aria-label={`${title} data`}
          className="w-full min-w-[320px] border-collapse text-left text-sm leading-[1.4]"
        >
          <caption className="sr-only">{title} data</caption>
          <thead>
            <tr className="border-b border-slate-300">
              <th className="py-2 pr-3 font-semibold text-slate-900" scope="col">
                Label
              </th>
              <th className="py-2 pr-3 font-semibold text-slate-900" scope="col">
                Count
              </th>
              <th className="py-2 font-semibold text-slate-900" scope="col">
                Percentage
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((datum) => (
              <tr className="border-b border-slate-200" key={datum.label}>
                <th className="break-words py-2 pr-3 font-medium text-slate-900" scope="row">
                  {datum.label}
                </th>
                <td className="py-2 pr-3 text-slate-700">{datum.count}</td>
                <td className="py-2 text-slate-700">{datum.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
