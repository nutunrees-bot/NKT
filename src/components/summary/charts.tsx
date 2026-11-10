import Link from "next/link";
import { shiftMonth } from "@/lib/domain/datetime";
import { Card } from "@/components/shell/ui";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/shell/icons";

/** ชิ้นส่วนกราฟที่หน้า "พื้นที่" และหน้า "สรุป EMS & REFER" ใช้ร่วมกัน */

export const SEVERITY_COLORS: [string, string, string][] = [
  ["สีแดง", "แดง (วิกฤต)", "#e74c3c"],
  ["สีเหลือง", "เหลือง (เร่งด่วน)", "#f1c40f"],
  ["สีเขียว", "เขียว (ไม่รุนแรง)", "#2ecc71"],
  ["สีขาว", "ขาว (ทั่วไป)", "#bdc3c7"],
  ["สีดำ", "ดำ (เสียชีวิต/อื่นๆ)", "#2c3e50"],
];

export function Kpi({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="rounded-2xl bg-(--card) px-4 py-3.5 shadow-(--card-shadow)">
      <div className="text-[30px] leading-none font-bold" style={{ color }}>
        {value}
      </div>
      <div className="mt-1.5 text-[12.5px] text-(--muted)">{label}</div>
    </div>
  );
}

export function Bar({
  label,
  count,
  max,
  color,
}: {
  label: string;
  count: number;
  max: number;
  color: string;
}) {
  return (
    <div className="my-2 flex items-center gap-2.5">
      <span className="w-[112px] shrink-0 text-right text-[13px]">{label}</span>
      <div className="h-[16px] flex-1 overflow-hidden rounded-full bg-(--page-bg)">
        <div
          className="h-full rounded-full"
          style={{
            width: `${max > 0 ? (count / max) * 100 : 0}%`,
            background: color,
          }}
        />
      </div>
      <span className="w-8 shrink-0 text-[13px] font-bold">{count}</span>
    </div>
  );
}

export function Donut({
  segments,
  total,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
}) {
  // ไล่ส่วนโค้งตามลำดับโดยไม่แก้ค่าตัวแปรนอกฟังก์ชัน (กติกา react-hooks/immutability)
  const shown = segments.filter((s) => s.count > 0);
  const stops = shown.map((s, i) => {
    const before = shown.slice(0, i).reduce((sum, prev) => sum + prev.count, 0);
    const start = (before / total) * 100;
    const end = ((before + s.count) / total) * 100;
    return `${s.color} ${start.toFixed(2)}% ${end.toFixed(2)}%`;
  });

  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <div
        className="flex size-[160px] shrink-0 items-center justify-center rounded-full"
        style={{
          background: stops.length
            ? `conic-gradient(${stops.join(", ")})`
            : "repeating-conic-gradient(#e9edf1 0 20deg, #f4f6f8 20deg 40deg)",
        }}
      >
        <div className="flex size-[100px] flex-col items-center justify-center rounded-full bg-(--card) shadow-[0_1px_4px_rgba(0,0,0,.08)]">
          <div className="text-[26px] font-bold">{total}</div>
          <div className="text-[11.5px] text-(--muted)">เคส</div>
        </div>
      </div>
      <div className="flex min-w-[190px] flex-col gap-2">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-2 text-[13.5px]">
            <span
              className="size-[11px] shrink-0 rounded-full"
              style={{ background: s.color }}
            />
            <span className="flex-1">{s.label}</span>
            <span className="font-bold">
              {s.count}{" "}
              <small className="font-medium text-(--muted)">
                ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
              </small>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="mb-4 p-4">
      <h2 className="mb-3 text-[15px] font-bold">{title}</h2>
      {children}
    </Card>
  );
}

/** เลือกเดือน: ปุ่มเลื่อนเดือน + ช่องเลือกเดือน · ส่ง ?ym= กลับมาที่ path เดิม */
export function MonthPicker({ path, ym }: { path: string; ym: string }) {
  return (
    <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-(--card-shadow)">
      <Link
        href={`${path}?ym=${shiftMonth(ym, -1)}`}
        aria-label="เดือนก่อน"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--page-bg)"
      >
        <ChevronLeftIcon className="size-5" />
      </Link>
      <form action={path} className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="month"
          name="ym"
          defaultValue={ym}
          className="min-w-0 flex-1 rounded-xl border border-(--line) bg-(--page-bg) px-2.5 py-2"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-(--accent) px-3.5 py-2.5 text-sm font-semibold text-white"
        >
          ดู
        </button>
      </form>
      <Link
        href={`${path}?ym=${shiftMonth(ym, 1)}`}
        aria-label="เดือนถัดไป"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--page-bg)"
      >
        <ChevronRightIcon className="size-5" />
      </Link>
    </div>
  );
}
