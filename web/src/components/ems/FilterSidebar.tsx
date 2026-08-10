"use client";

import { RotateCcw, Building2, CalendarRange, HeartPulse } from "lucide-react";

const CATEGORIES = [
  "อุบัติเหตุทั่วไป / จราจร",
  "ผู้ป่วย พรบ. ผู้ประสบภัยจากรถ",
  "ผู้ป่วยฉุกเฉินวิกฤต/โรคทั่วไป",
];

const SEVERITY = [
  { key: "red", label: "สีแดง (Emergency)", color: "var(--triage-red)" },
  { key: "yellow", label: "สีเหลือง (Urgency)", color: "var(--triage-yellow)" },
  { key: "green", label: "สีเขียว (Non-Urgent)", color: "var(--triage-green)" },
  { key: "gray", label: "สีเทา (Death ณ ที่เกิดเหตุ)", color: "var(--text-muted)" },
];

type FilterSidebarProps = {
  months: string[];
  fromIndex: number;
  toIndex: number;
  onFromChange: (i: number) => void;
  onToChange: (i: number) => void;
  activeCategories: Set<string>;
  onToggleCategory: (c: string) => void;
  activeSeverity: Set<string>;
  onToggleSeverity: (s: string) => void;
  onReset: () => void;
};

export default function FilterSidebar({
  months,
  fromIndex,
  toIndex,
  onFromChange,
  onToChange,
  activeCategories,
  onToggleCategory,
  activeSeverity,
  onToggleSeverity,
  onReset,
}: FilterSidebarProps) {
  return (
    <aside className="h-fit space-y-5 rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm lg:sticky lg:top-[96px]">
      <div className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
        <span className="text-(--brand-navy)">⚙</span>
        แผงควบคุมตัวกรอง
      </div>
      <p className="-mt-3 text-xs text-(--text-muted)">
        ปรับแต่งมุมมองของข้อมูล EMS
      </p>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
          <Building2 size={14} /> หน่วยงานปฏิบัติการ
        </label>
        <select
          disabled
          className="w-full rounded-lg border border-(--border-hairline) bg-(--page-bg) px-3 py-2 text-sm text-(--text-primary) disabled:opacity-80"
          defaultValue="main"
        >
          <option value="main">EMS โรงพยาบาลสมเด็จพระยุพราชนครไทย</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
          <CalendarRange size={14} /> ช่วงเวลาปฏิบัติการ (ปีงบ 69)
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[11px] text-(--text-muted)">ตั้งแต่เดือน</span>
            <select
              value={fromIndex}
              onChange={(e) => onFromChange(Number(e.target.value))}
              className="mt-0.5 w-full rounded-lg border border-(--border-hairline) bg-(--page-bg) px-2 py-1.5 text-sm"
            >
              {months.map((m, i) => (
                <option key={m} value={i} disabled={i > toIndex}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <span className="text-[11px] text-(--text-muted)">ถึงเดือน</span>
            <select
              value={toIndex}
              onChange={(e) => onToChange(Number(e.target.value))}
              className="mt-0.5 w-full rounded-lg border border-(--border-hairline) bg-(--page-bg) px-2 py-1.5 text-sm"
            >
              {months.map((m, i) => (
                <option key={m} value={i} disabled={i < fromIndex}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-(--text-secondary)">
          สถิติเฉพาะหมวดหมู่
        </p>
        <div className="space-y-1.5">
          {CATEGORIES.map((c) => (
            <label
              key={c}
              className="flex cursor-pointer items-center gap-2 text-xs text-(--text-primary)"
            >
              <input
                type="checkbox"
                checked={activeCategories.has(c)}
                onChange={() => onToggleCategory(c)}
                className="h-3.5 w-3.5 accent-(--brand-navy)"
              />
              {c}
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-(--text-secondary)">
          <HeartPulse size={14} /> ไฮไลท์ระดับความเร่งด่วน
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {SEVERITY.map((s) => {
            const active = activeSeverity.has(s.key);
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => onToggleSeverity(s.key)}
                className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-[11px] font-medium transition-colors"
                style={{
                  borderColor: active ? s.color : "var(--border-hairline)",
                  backgroundColor: active ? `${s.color}14` : "transparent",
                  color: active ? s.color : "var(--text-secondary)",
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: s.color }}
                />
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-(--border-hairline) py-2 text-xs font-semibold text-(--text-secondary) transition-colors hover:bg-(--page-bg)"
      >
        <RotateCcw size={13} /> รีเซ็ตตัวกรองทั้งหมด
      </button>

      <div className="border-t border-(--border-hairline) pt-3 text-[11px] leading-relaxed text-(--text-muted)">
        <p className="font-semibold text-(--text-secondary)">
          รพ.สมเด็จพระยุพราชนครไทย
        </p>
        <p>EMSNKT Command Center v1</p>
      </div>
    </aside>
  );
}
