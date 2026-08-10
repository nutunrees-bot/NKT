import type { traumaMatrix as traumaMatrixType } from "@/lib/mock-ems";

export default function TraumaMatrix({
  data,
}: {
  data: typeof traumaMatrixType;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--series-1)" }}
          />
          เปรียบเทียบระดับความรุนแรง (Trauma vs Non-Trauma)
        </h3>
      </div>
      <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-(--page-bg) px-3 py-1.5 text-xs font-medium text-(--text-secondary)">
        กลุ่มผู้ป่วยอุบัติเหตุ (Trauma Case Matrix)
        <span className="tabular-nums font-bold text-(--text-primary)">
          {total.toLocaleString("th-TH")}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {data.map((d) => (
          <div
            key={d.short}
            className="rounded-lg border p-3 text-center"
            style={{
              borderColor: `${d.color}33`,
              backgroundColor: `${d.color}0d`,
            }}
          >
            <p
              className="text-2xl font-bold tabular-nums"
              style={{ color: d.color }}
            >
              {d.value}
            </p>
            <p className="mt-0.5 text-[11px] text-(--text-secondary)">
              {d.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
