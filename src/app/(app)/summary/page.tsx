import Link from "next/link";
import { RegistryIcon, SheetIcon } from "@/components/shell/icons";
import { getLookups, getMonthlySummary } from "@/lib/data/queries";
import { currentMonthISO, thaiMonthLabel } from "@/lib/domain/datetime";
import { PageHeader } from "@/components/shell/ui";
import {
  Bar,
  Donut,
  Kpi,
  MonthPicker,
  Panel,
  SEVERITY_COLORS,
} from "@/components/summary/charts";

/** สรุป EMS & REFER รายเดือน — เข้าจากปุ่มในหน้าโปรไฟล์ */
export default async function SummaryPage({ searchParams }: PageProps<"/summary">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ym) ? sp.ym[0] : sp.ym;
  const ym = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();

  const [{ ems, refer }, lookups] = await Promise.all([
    getMonthlySummary(ym),
    getLookups(),
  ]);
  const hospitalMax = Math.max(1, ...Object.values(refer.byHospital));

  return (
    // page-wide: เต็มจอบนคอม (globals.css) · มือถือคงเดิม
    <div className="page-wide">
      <PageHeader title="สรุป EMS & REFER" subtitle={thaiMonthLabel(ym)} />

      <MonthPicker path="/summary" ym={ym} />

      {/* ทะเบียนออกเหตุรายเดือน (ผังเดียวกับชีต EMS69 ที่พิมพ์มือ) ของเดือนที่เลือก */}
      <div className="mb-4 grid gap-2 lg:grid-cols-2">
        <Link
          href={`/register?ym=${ym}`}
          className="flex items-center justify-center gap-2 rounded-2xl border-2 border-(--accent) bg-white px-4 py-3 text-[14.5px] font-semibold text-(--accent) shadow-(--card-shadow) active:opacity-90"
        >
          <RegistryIcon className="size-5" />
          ดูตารางทะเบียนออกเหตุ · {thaiMonthLabel(ym)}
        </Link>
        <a
          href={`/api/export/ems-month?ym=${ym}`}
          download
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#1d6f42] px-4 py-3 text-[14.5px] font-semibold text-white shadow-(--card-shadow) active:opacity-90"
        >
          <SheetIcon className="size-5" />
          ดึงทะเบียนรายเดือน (Excel) · {thaiMonthLabel(ym)}
        </a>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi value={ems.total} label="ออกเหตุ EMS ทั้งหมด" color="var(--accent)" />
        <Kpi value={ems.found} label="พบเหตุ" color="#2e7d32" />
        <Kpi value={ems.notFound} label="ไม่พบเหตุ" color="#b8590f" />
        <Kpi value={refer.total} label="ส่งต่อ (REFER) ทั้งหมด" color="#1d5f99" />
      </div>

      {/* บนคอมเรียงแผงเป็น 2 คอลัมน์ · มือถือเรียงลงมาแถวเดียว */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
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
      </div>

      <p className="text-center text-[12px] text-(--muted)">
        ระยะทางรวมเดือนนี้ {ems.totalKm} กม.
      </p>
    </div>
  );
}
