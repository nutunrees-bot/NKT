import Link from "next/link";
import AreaMap from "@/components/summary/AreaMap";
import { getLookups, getMonthlySummary } from "@/lib/data/queries";
import { currentMonthISO, thaiMonthLabel } from "@/lib/domain/datetime";

const SEVERITY_COLORS: [string, string, string][] = [
  ["สีแดง", "แดง (วิกฤต)", "#e74c3c"],
  ["สีเหลือง", "เหลือง (เร่งด่วน)", "#f1c40f"],
  ["สีเขียว", "เขียว (ไม่รุนแรง)", "#2ecc71"],
  ["สีขาว", "ขาว (ทั่วไป)", "#bdc3c7"],
  ["สีดำ", "ดำ (เสียชีวิต/อื่นๆ)", "#2c3e50"],
];

function Kpi({
  icon,
  value,
  label,
  gradient,
}: {
  icon: string;
  value: number;
  label: string;
  gradient: string;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 text-white shadow-[0_6px_16px_rgba(10,46,77,.16)]"
      style={{ background: gradient }}
    >
      <div className="mb-1.5 text-[22px] opacity-90">{icon}</div>
      <div className="text-[32px] leading-none font-extrabold">{value}</div>
      <div className="mt-1.5 text-[12.5px] opacity-90">{label}</div>
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
      <span className="w-[130px] shrink-0 text-right text-[13px]">{label}</span>
      <div className="h-[18px] flex-1 overflow-hidden rounded-md bg-[#eef1f5]">
        <div
          className="h-full rounded-md"
          style={{ width: `${max > 0 ? (count / max) * 100 : 0}%`, background: color }}
        />
      </div>
      <span className="w-9 shrink-0 text-[13px] font-bold text-(--navy)">
        {count}
      </span>
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
        className="flex size-[170px] shrink-0 items-center justify-center rounded-full"
        style={{
          background: stops.length
            ? `conic-gradient(${stops.join(", ")})`
            : "repeating-conic-gradient(#e9edf1 0 20deg, #f4f6f8 20deg 40deg)",
        }}
      >
        <div className="flex size-[104px] flex-col items-center justify-center rounded-full bg-(--card) shadow-[0_1px_4px_rgba(0,0,0,.08)]">
          <div className="text-[26px] font-extrabold text-(--navy)">{total}</div>
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
            <span className="font-bold text-(--navy)">
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
    <section className="mb-4 rounded-2xl border border-(--line) bg-(--card) p-5">
      <h2 className="mb-4 text-base font-semibold text-(--navy)">{title}</h2>
      {children}
    </section>
  );
}

export default async function SummaryPage({ searchParams }: PageProps<"/summary">) {
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

  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-lg border border-(--line) bg-white px-3.5 py-2 text-sm"
        >
          ← กลับ
        </Link>
        <h2 className="text-lg font-bold">
          สรุป EMS &amp; REFER — {thaiMonthLabel(ym)}
        </h2>
      </div>

      <form className="mb-4 flex items-center gap-2.5 rounded-xl border border-(--line) bg-(--card) px-3.5 py-3">
        <label className="text-[13.5px] text-(--muted)">🗓️ เลือกเดือน</label>
        <input
          type="month"
          name="ym"
          defaultValue={ym}
          className="rounded-lg border border-(--line) bg-white px-2.5 py-2"
        />
        <button
          type="submit"
          className="rounded-lg bg-(--hivis-dark) px-3.5 py-2 text-sm font-semibold text-white"
        >
          ดู
        </button>
      </form>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Kpi
          icon="🚑"
          value={ems.total}
          label="ออกเหตุ EMS ทั้งหมด"
          gradient="linear-gradient(135deg,#146aa8,#2f8fd1)"
        />
        <Kpi
          icon="✅"
          value={ems.found}
          label="พบเหตุ"
          gradient="linear-gradient(135deg,#1e8e5a,#3cb87d)"
        />
        <Kpi
          icon="🚫"
          value={ems.notFound}
          label="ไม่พบเหตุ"
          gradient="linear-gradient(135deg,#b8590f,#e08a2c)"
        />
        <Kpi
          icon="🔁"
          value={refer.total}
          label="ส่งต่อ (REFER) ทั้งหมด"
          gradient="linear-gradient(135deg,#7b3fa0,#a561c9)"
        />
      </div>

      <Panel title="🩹 ประเภทเหตุ (EMS)">
        <Bar label="Trauma" count={ems.trauma} max={ems.total || 1} color="#e74c3c" />
        <Bar
          label="Non-Trauma"
          count={ems.nonTrauma}
          max={ems.total || 1}
          color="#3498db"
        />
      </Panel>

      <Panel title="🏥 ประเภทเหตุ (REFER)">
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

      <Panel title="🎯 ระดับความรุนแรง (RC Code)">
        <Donut
          total={ems.total}
          segments={SEVERITY_COLORS.map(([key, label, color]) => ({
            label,
            color,
            count: ems.severity[key] ?? 0,
          }))}
        />
      </Panel>

      <Panel title="🗺️ พื้นที่รับผิดชอบ (ตามตำบล)">
        <AreaMap areas={lookups.subdistricts} counts={ems.bySubdistrict} />
      </Panel>

      <Panel title="📍 จำนวนเหตุแยกตามพื้นที่">
        {lookups.subdistricts.map((area) => (
          <Bar
            key={area}
            label={area}
            count={ems.bySubdistrict[area] ?? 0}
            max={areaMax}
            color="#146aa8"
          />
        ))}
      </Panel>

      <Panel title="🏥 REFER แยกตามโรงพยาบาลที่ส่งต่อ">
        {lookups.hospitals.map((h) => (
          <Bar
            key={h}
            label={h}
            count={refer.byHospital[h] ?? 0}
            max={hospitalMax}
            color="#7b3fa0"
          />
        ))}
      </Panel>

      <p className="text-center text-[12px] text-(--muted)">
        ระยะทางรวมเดือนนี้ {ems.totalKm} กม.
      </p>
    </>
  );
}
