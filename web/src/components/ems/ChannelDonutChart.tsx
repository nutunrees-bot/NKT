"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { channels as channelsType } from "@/lib/mock-ems";

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { name: string; value: number; payload: { color: string } }[];
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-(--border-hairline) bg-(--surface-1) px-3 py-2 text-xs shadow-md">
      <p className="flex items-center gap-1.5 font-semibold text-(--text-primary)">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: p.payload.color }}
        />
        {p.name}
      </p>
      <p className="tabular-nums text-(--text-secondary)">{p.value} เคส</p>
    </div>
  );
}

export default function ChannelDonutChart({
  data,
}: {
  data: typeof channelsType;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="w-full">
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="var(--surface-1)"
              strokeWidth={2}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tabular-nums text-(--text-primary)">
            {total.toLocaleString("th-TH")}
          </span>
          <span className="text-[11px] text-(--text-muted)">เคสทั้งหมด</span>
        </div>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1.5">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-1.5 text-xs">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: d.color }}
            />
            <span className="truncate text-(--text-secondary)">{d.name}</span>
            <span className="ml-auto shrink-0 tabular-nums font-medium text-(--text-primary)">
              {d.value}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
