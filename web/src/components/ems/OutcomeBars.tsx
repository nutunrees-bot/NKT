import type { outcomes as outcomesType } from "@/lib/mock-ems";

export default function OutcomeBars({ data }: { data: typeof outcomesType }) {
  return (
    <div className="rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--status-good)" }}
        />
        ผลการรักษาขั้นสุดท้าย (D/C, Admit, Refer, Death ณ โรงพยาบาล)
      </h3>
      <div className="mt-4 space-y-4">
        {data.map((d) => (
          <div key={d.label}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <span className="truncate text-(--text-secondary)">
                {d.label}
              </span>
              <span className="shrink-0 tabular-nums font-semibold text-(--text-primary)">
                {d.value.toLocaleString("th-TH")} เคส ({d.pct}%)
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-(--page-bg)">
              <div
                className="h-full rounded-full"
                style={{ width: `${d.pct}%`, backgroundColor: d.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
