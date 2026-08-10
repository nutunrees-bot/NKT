"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyShift } from "@/lib/mock-ems";

const SERIES = [
  { key: "morning", name: "เวรเช้า (08:00-16:00)", color: "var(--series-1)" },
  { key: "afternoon", name: "เวรบ่าย (16:00-24:00)", color: "var(--series-2)" },
  { key: "night", name: "เวรดึก (24:00-08:00)", color: "var(--text-muted)" },
] as const;

function ShiftLegend() {
  return (
    <ul className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-(--text-secondary)">
      {SERIES.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: s.color }}
          />
          {s.name}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s, p) => s + p.value, 0);
  return (
    <div className="rounded-lg border border-(--border-hairline) bg-(--surface-1) px-3 py-2 text-xs shadow-md">
      <p className="mb-1 font-semibold text-(--text-primary)">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5 text-(--text-secondary)">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: p.color }}
            />
            {p.name}
          </span>
          <span className="tabular-nums font-medium text-(--text-primary)">
            {p.value}
          </span>
        </div>
      ))}
      <div className="mt-1 flex items-center justify-between gap-4 border-t border-(--border-hairline) pt-1 font-semibold">
        <span className="text-(--text-secondary)">รวม</span>
        <span className="tabular-nums text-(--text-primary)">{total}</span>
      </div>
    </div>
  );
}

export default function ShiftStackedBarChart({
  data,
}: {
  data: MonthlyShift[];
}) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke="var(--gridline)"
            strokeDasharray="0"
          />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={{ stroke: "var(--baseline)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--text-muted)" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--gridline)", opacity: 0.4 }} />
          <Legend content={<ShiftLegend />} />
          {SERIES.map((s, i) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              stackId="shift"
              fill={s.color}
              radius={i === SERIES.length - 1 ? [4, 4, 0, 0] : 0}
              maxBarSize={34}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
