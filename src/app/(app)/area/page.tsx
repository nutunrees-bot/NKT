import AreaMap from "@/components/summary/AreaMap";
import { Bar, MonthPicker, Panel } from "@/components/summary/charts";
import { getLookups, getMonthlySummary } from "@/lib/data/queries";
import { currentMonthISO, thaiMonthLabel } from "@/lib/domain/datetime";
import { PageHeader } from "@/components/shell/ui";

/**
 * พื้นที่ (แท็บหมุด) — เหตุแยกตามตำบลรายเดือน + แผนผังพื้นที่
 * สรุป EMS & REFER + ทะเบียนรายเดือน/Excel อยู่หน้า /summary (เข้าจากปุ่มในหน้าโปรไฟล์)
 */
export default async function AreaPage({ searchParams }: PageProps<"/area">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ym) ? sp.ym[0] : sp.ym;
  const ym = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();

  const [summary, lookups] = await Promise.all([
    getMonthlySummary(ym),
    getLookups(),
  ]);

  const { ems } = summary;
  const areaMax = Math.max(1, ...Object.values(ems.bySubdistrict));

  // ตำบลที่ไม่อยู่ในรายการอ้างอิง (เช่น ข้อมูลเก่าสะกดต่าง) + เคสที่ไม่ได้ระบุตำบล
  const known = new Set(lookups.subdistricts);
  const otherAreas = Object.entries(ems.bySubdistrict).filter(
    ([a]) => !known.has(a),
  );
  const withArea = Object.values(ems.bySubdistrict).reduce((a, b) => a + b, 0);
  const noArea = ems.total - withArea;

  return (
    // page-wide: เต็มจอบนคอม (globals.css) · มือถือคงเดิม
    <div className="page-wide">
      <PageHeader
        title="พื้นที่เกิดเหตุ"
        subtitle={`เหตุ EMS แยกตามตำบล · ${thaiMonthLabel(ym)}`}
      />

      <MonthPicker path="/area" ym={ym} />

      {/* บนคอมเรียงแผงเป็น 2 คอลัมน์ · มือถือเรียงลงมาแถวเดียวเหมือนเดิม */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-x-4">
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
            <Bar
              key={area}
              label={area}
              count={count}
              max={areaMax}
              color="#9ca3af"
            />
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
      </div>
    </div>
  );
}
