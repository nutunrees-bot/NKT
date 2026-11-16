import { countAllCases, searchCases } from "@/lib/data/queries";
import { EmsCaseCard } from "@/components/cases/CaseCards";
import { PageHeader } from "@/components/shell/ui";
import { SearchIcon } from "@/components/shell/icons";

const LIMIT = 50;

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/**
 * ทะเบียน — ค้นข้อมูลผู้ป่วย EMS ย้อนหลังทุกวันที่ด้วย HN / ชื่อ / เลขบัตร
 * ไม่ใส่คำค้น = โชว์เคสล่าสุด · แต่ละการ์ดดึงข้อมูลเคสเป็น Excel ได้
 */
export default async function RegistryPage({ searchParams }: PageProps<"/registry">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 60);

  const [ems, total] = await Promise.all([searchCases(q, LIMIT), countAllCases()]);

  return (
    // page-wide: บนจอคอม (>= 1024px) ขยายหน้านี้เต็มจอ — ดู globals.css · มือถือคงเดิม
    <div className="page-wide">
      <PageHeader
        title="ทะเบียนผู้ป่วย"
        subtitle={`เคส EMS ที่บันทึกในระบบ ${total.toLocaleString("th-TH")} ราย`}
      />

      <form className="relative mb-3">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-(--muted)" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="ค้นหา HN / ชื่อ / เลขบัตรประชาชน"
          enterKeyHint="search"
          className="w-full rounded-2xl border border-(--line) bg-white py-3 pr-4 pl-11 shadow-(--card-shadow) outline-none focus:border-(--accent)"
        />
      </form>

      <p className="mb-2 text-[12.5px] text-(--muted)">
        {q ? `ผลการค้นหา "${q}" · ${ems.length} เคส` : "เคสล่าสุด"}
        {ems.length >= LIMIT && ` (แสดงสูงสุด ${LIMIT} เคส — พิมพ์คำค้นให้เจาะจงขึ้น)`}
      </p>

      {ems.length === 0 ? (
        <p className="rounded-2xl bg-white py-8 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
          ไม่พบข้อมูลผู้ป่วย
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
          {ems.map((c) => (
            <EmsCaseCard key={c.id} c={c} big="age" />
          ))}
        </ul>
      )}
    </div>
  );
}
