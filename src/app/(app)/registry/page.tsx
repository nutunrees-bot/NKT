import { countAllCases, searchCases } from "@/lib/data/queries";
import { EmsCaseCard, ReferCaseCard } from "@/components/cases/CaseCards";
import { FilterChips, PageHeader } from "@/components/shell/ui";
import { SearchIcon } from "@/components/shell/icons";

const LIMIT = 50;

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

/**
 * ทะเบียน — ค้นข้อมูลผู้ป่วยย้อนหลังทุกวันที่ด้วย HN / ชื่อ / เลขบัตร
 * ไม่ใส่คำค้น = โชว์เคสล่าสุด · แต่ละการ์ดดึงข้อมูลเคสเป็น Excel ได้
 */
export default async function RegistryPage({ searchParams }: PageProps<"/registry">) {
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 60);
  const type = one(sp.type) || "all";

  const [{ ems, refer }, totals] = await Promise.all([
    searchCases(q, LIMIT),
    countAllCases(),
  ]);

  const href = (t: string) =>
    `/registry?${new URLSearchParams(q ? { q, type: t } : { type: t }).toString()}`;

  const showEms = type !== "refer";
  const showRefer = type !== "ems";
  const nothing = (!showEms || ems.length === 0) && (!showRefer || refer.length === 0);

  return (
    <>
      <PageHeader
        title="ทะเบียนผู้ป่วย"
        subtitle={`เคสที่บันทึกในระบบ EMS ${totals.ems.toLocaleString("th-TH")} · Refer ${totals.refer.toLocaleString("th-TH")} ราย`}
      />

      <form className="relative mb-3">
        <input type="hidden" name="type" value={type} />
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

      <FilterChips
        items={[
          {
            label: "ทั้งหมด",
            count: ems.length + refer.length,
            href: href("all"),
            active: type === "all",
          },
          { label: "EMS", count: ems.length, href: href("ems"), active: type === "ems" },
          {
            label: "Refer",
            count: refer.length,
            href: href("refer"),
            active: type === "refer",
          },
        ]}
      />

      <p className="mb-2 text-[12.5px] text-(--muted)">
        {q ? `ผลการค้นหา "${q}"` : "เคสล่าสุด"}
        {(ems.length >= LIMIT || refer.length >= LIMIT) &&
          ` (แสดงสูงสุด ${LIMIT} เคสต่อประเภท — พิมพ์คำค้นให้เจาะจงขึ้น)`}
      </p>

      {nothing ? (
        <p className="rounded-2xl bg-white py-8 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
          ไม่พบข้อมูลผู้ป่วย
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {/* รวม EMS + Refer เรียงวันที่ล่าสุดก่อน */}
          {[
            ...(showEms ? ems.map((c) => ({ date: c.incident_date, ems: c })) : []),
            ...(showRefer ? refer.map((c) => ({ date: c.refer_date, refer: c })) : []),
          ]
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((row) =>
              "ems" in row && row.ems ? (
                <EmsCaseCard key={`e-${row.ems.id}`} c={row.ems} big="age" />
              ) : "refer" in row && row.refer ? (
                <ReferCaseCard key={`r-${row.refer.id}`} c={row.refer} />
              ) : null,
            )}
        </ul>
      )}
    </>
  );
}
