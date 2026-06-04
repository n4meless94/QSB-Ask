"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
  const total = data.reduce((sum, datum) => sum + datum.count, 0);
  const hasResponses = total > 0;
  const maxCount = Math.max(1, ...data.map((datum) => datum.count));
  const chartHeight = Math.min(260, Math.max(156, data.length * 54));

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
      </div>

      <div aria-label={`${title} chart`} className="w-full" role="img">
        <ResponsiveContainer height={chartHeight} width="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ bottom: 8, left: 8, right: 112, top: 8 }}
          >
            <CartesianGrid stroke="#CBD5E1" strokeDasharray="3 3" />
            <XAxis
              allowDecimals={false}
              dataKey="count"
              domain={[0, maxCount]}
              tick={{ fill: "#334155", fontSize: 13 }}
              type="number"
            />
            <YAxis dataKey="label" tick={{ fill: "#334155", fontSize: 13 }} type="category" width={112} />
            <Tooltip
              formatter={(value, _name, item) => {
                const datum = item.payload as SurveyChartDatum;
                return [`${responseCopy(Number(value))} (${datum.percentage}%)`, datum.label];
              }}
            />
            <Bar dataKey="count" fill="#0F766E" minPointSize={hasResponses ? 3 : 0}>
              <LabelList
                content={({ index, x, y, width, height }) => {
                  if (typeof index !== "number") return null;
                  const datum = data[index];
                  if (!datum) return null;

                  return (
                    <text
                      fill="#0F172A"
                      fontSize={14}
                      x={Number(x) + Number(width) + 8}
                      y={Number(y) + Number(height) / 2 + 5}
                    >
                      {responseCopy(datum.count)}, {datum.percentage}%
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ul className="grid gap-2 text-sm leading-[1.4] text-slate-700">
        {data.map((datum) => (
          <li className="break-words" key={datum.label}>
            {labelCopy(datum)}
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
