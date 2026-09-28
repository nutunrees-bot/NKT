import Link from "next/link";
import AreaMap from "@/components/summary/AreaMap";
import { getLookups, getMonthlySummary } from "@/lib/data/queries";
import {
  currentMonthISO,
  shiftMonth,
  thaiMonthLabel,
} from "@/lib/domain/datetime";
import { Card, PageHeader } from "@/components/shell/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SheetIcon,
} from "@/components/shell/icons";

const SEVERITY_COLORS: [string, string, string][] = [
  ["สีแดง", "แดง (วิกฤต)", "#e74c3c"],
  ["สีเหลือง", "เหลือง (เร่งด่วน)", "#f1c40f"],
  ["สีเขียว", "เขียว (ไม่รุนแรง)", "#2ecc71"],
  ["สีขาว", "ขาว (ทั่วไป)", "#bdc3c7"],
  ["สีดำ", "ดำ (เสียชีวิต/อื่นๆ)", "#2c3e50"],
];

function Kpi({
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

function Bar({
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
          style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, background: color }}
        />
      </div>
      <span className="w-8 shrink-0 text-[13px] font-bold">{count}</span>
    </div>
  );
}

function Donut({
  segments,
  total,
}: {
  segments: { label: string; count: number; color: string }[];
  total: number;
}) {
  // ไล่ส่วนโค้งตามลำดับโดยไม่แก้ค่าตัวแปรนอกฟังก์ชัน (กติกา react-hooks/immutability)
  const shown = segments.filter((s) => s.count > 0);
  const stops = shown.map((s, i) => {
    const before = shown
      .slice(0, i)
      .reduce((sum, prev) => sum + prev.count, 0);
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

function Panel({
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

/**
 * พื้นที่ (แท็บหมุด) — เหตุแยกตามตำบลรายเดือน + สรุป EMS & REFER ทั้งหมด
 * (ย้ายมาจากหน้า /summary เดิม ฟีเจอร์ครบเหมือนเดิม)
 */
export default async function AreaPage({ searchParams }: PageProps<"/area">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ym) ? sp.ym[0] : sp.ym;
  const ym = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();

  const [summary, lookups] = await Promise.all([
    getMonthlySummary(ym),
    getLookups(),
  ]);

  const { ems, refer } = summary;
  const areaMax = Math.max(1, ...Object.values(ems.bySubdistrict));
  const hospitalMax = Math.max(1, ...Object.values(refer.byHospital));

  // ตำบลที่ไม่อยู่ในรายการอ้างอิง (เช่น ข้อมูลเก่าสะกดต่าง) + เคสที่ไม่ได้ระบุตำบล
  const known = new Set(lookups.subdistricts);
  const otherAreas = Object.entries(ems.bySubdistrict).filter(([a]) => !known.has(a));
  const withArea = Object.values(ems.bySubdistrict).reduce((a, b) => a + b, 0);
  const noArea = ems.total - withArea;

  return (
    <>
      <PageHeader
        title="พื้นที่เกิดเหตุ"
        subtitle={`เหตุ EMS แยกตามตำบล · ${thaiMonthLabel(ym)}`}
      />

      {/* เลือกเดือน: ปุ่มเลื่อนเดือน + ช่องเลือกเดือน */}
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-(--card-shadow)">
        <Link
          href={`/area?ym=${shiftMonth(ym, -1)}`}
          aria-label="เดือนก่อน"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--page-bg)"
        >
          <ChevronLeftIcon className="size-5" />
        </Link>
        <form className="flex min-w-0 flex-1 items-center gap-2">
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
          href={`/area?ym=${shiftMonth(ym, 1)}`}
          aria-label="เดือนถัดไป"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--page-bg)"
        >
          <ChevronRightIcon className="size-5" />
        </Link>
      </div>

      {/* ทะเบียนออกเหตุรายเดือน (ผังเดียวกับชีต EMS69 ที่พิมพ์มือ) ของเดือนที่เลือก */}
      <a
        href={`/api/export/ems-month?ym=${ym}`}
        download
        className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-[#1d6f42] px-4 py-3 text-[14.5px] font-semibold text-white shadow-(--card-shadow) active:opacity-90"
      >
        <SheetIcon className="size-5" />
        ดึงทะเบียนรายเดือน (Excel) · {thaiMonthLabel(ym)}
      </a>

      <Panel title="จำนวนเหตุแยกตามตำบล">
        {lookups.subdistricts.map((area) => (
          <Bar
            key={area}
            label={area}
            count={ems.bySubdistrict[area] ?? 0}
            max={areaMax}
            color="var(--accent)"
          />
        ))}
        {otherAreas.map(([area, count]) => (
          <Bar key={area} label={area} count={count} max={areaMax} color="#9ca3af" />
        ))}
        {noArea > 0 && (
          <p className="mt-2 text-[12px] text-(--muted)">
            ไม่ได้ระบุตำบล {noArea} เคส
          </p>
        )}
      </Panel>

      <Panel title="แผนผังพื้นที่รับผิดชอบ">
        <AreaMap areas={lookups.subdistricts} counts={ems.bySubdistrict} />
      </Panel>

      <h2 className="mt-6 mb-3 text-[17px] font-bold">
        สรุป EMS &amp; REFER — {thaiMonthLabel(ym)}
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Kpi value={ems.total} label="ออกเหตุ EMS ทั้งหมด" color="var(--accent)" />
        <Kpi value={ems.found} label="พบเหตุ" color="#2e7d32" />
        <Kpi value={ems.notFound} label="ไม่พบเหตุ" color="#b8590f" />
        <Kpi value={refer.total} label="ส่งต่อ (REFER) ทั้งหมด" color="#1d5f99" />
      </div>

      <Panel title="ประเภทเหตุ (EMS)">
        <Bar label="Trauma" count={ems.trauma} max={ems.total || 1} color="#e74c3c" />
        <Bar
          label="Non-Trauma"
          count={ems.nonTrauma}
          max={ems.total || 1}
          color="#3498db"
        />
      </Panel>

      <Panel title="ประเภทเหตุ (REFER)">
        <Bar
          label="Trauma"
          count={refer.trauma}
          max={refer.total || 1}
          color="#e74c3c"
        />
        <Bar
          label="Non-Trauma"
          count={refer.nonTrauma}
          max={refer.total || 1}
          color="#3498db"
        />
      </Panel>

      <Panel title="ระดับความรุนแรง (RC Code)">
        <Donut
          total={ems.total}
          segments={SEVERITY_COLORS.map(([key, label, color]) => ({
            label,
            color,
            count: ems.severity[key] ?? 0,
          }))}
        />
      </Panel>

      <Panel title="REFER แยกตามโรงพยาบาลที่ส่งต่อ">
        {lookups.hospitals.map((h) => (
          <Bar
            key={h}
            label={h}
            count={refer.byHospital[h] ?? 0}
            max={hospitalMax}
            color="#1d5f99"
          />
        ))}
      </Panel>

      <p className="text-center text-[12px] text-(--muted)">
        ระยะทางรวมเดือนนี้ {ems.totalKm} กม.
      </p>
    </>
  );
}
