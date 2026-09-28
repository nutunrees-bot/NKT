import Link from "next/link";
import { listEmsCases, listReferCases } from "@/lib/data/queries";
import { thaiDate, todayISO } from "@/lib/domain/datetime";
import { EmsCaseCard, ReferCaseCard } from "@/components/cases/CaseCards";
import { FilterChips, PageHeader } from "@/components/shell/ui";
import { PrinterIcon } from "@/components/shell/icons";

function one(v: string | string[] | undefined, fallback: string) {
  return (Array.isArray(v) ? v[0] : v) || fallback;
}

function rangeLabel(from: string, to: string) {
  return from === to ? thaiDate(from) : `${thaiDate(from)} – ${thaiDate(to)}`;
}

/**
 * รายการเคส (ปุ่มรถพยาบาลตรงกลาง) — ยกมาจากหน้าแรกเดิมทั้งหมด:
 * ช่วงวันที่แยก EMS / REFER (ค่าเริ่มต้นวันนี้), แก้ไข, พิมพ์ ALS, ALS เปล่า,
 * พิมพ์ Refer, ลบ · เพิ่มชิปเลือกดูเฉพาะ EMS หรือ Refer
 */
export default async function CasesPage({ searchParams }: PageProps<"/cases">) {
  const sp = await searchParams;
  const today = todayISO();
  const eFrom = one(sp.e_from, today);
  const eTo = one(sp.e_to, today);
  const rFrom = one(sp.r_from, today);
  const rTo = one(sp.r_to, today);
  const view = one(sp.view, "all");

  const [emsCases, referCases] = await Promise.all([
    listEmsCases(eFrom, eTo),
    listReferCases(rFrom, rTo),
  ]);

  const base = { e_from: eFrom, e_to: eTo, r_from: rFrom, r_to: rTo };
  const href = (v: string) =>
    `/cases?${new URLSearchParams({ ...base, view: v }).toString()}`;

  return (
    <>
      <PageHeader
        title="รายการเคส"
        subtitle={`EMS ${emsCases.length} เคส · Refer ${referCases.length} เคส`}
        right={
          <Link
            href="/print/als/blank"
            target="_blank"
            className="flex shrink-0 items-center gap-1.5 rounded-full border border-(--line) bg-white px-3 py-1.5 text-[12.5px] font-medium text-(--muted)"
          >
            <PrinterIcon className="size-4" /> ALS เปล่า
          </Link>
        }
      />

      <FilterChips
        items={[
          {
            label: "ทั้งหมด",
            count: emsCases.length + referCases.length,
            href: href("all"),
            active: view === "all",
          },
          { label: "EMS", count: emsCases.length, href: href("ems"), active: view === "ems" },
          {
            label: "Refer",
            count: referCases.length,
            href: href("refer"),
            active: view === "refer",
          },
        ]}
      />

      {view !== "refer" && (
        <section className="mb-6">
          <SectionHead title="EMS" range={rangeLabel(eFrom, eTo)} />
          <DateRangeForm
            from={eFrom}
            to={eTo}
            fromName="e_from"
            toName="e_to"
            preserve={{ r_from: rFrom, r_to: rTo, view }}
          />
          {emsCases.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-3">
              {emsCases.map((c) => (
                <EmsCaseCard key={c.id} c={c} big="seq" />
              ))}
            </ul>
          )}
        </section>
      )}

      {view !== "ems" && (
        <section>
          <SectionHead title="Refer" range={rangeLabel(rFrom, rTo)} />
          <DateRangeForm
            from={rFrom}
            to={rTo}
            fromName="r_from"
            toName="r_to"
            preserve={{ e_from: eFrom, e_to: eTo, view }}
          />
          {referCases.length === 0 ? (
            <Empty />
          ) : (
            <ul className="flex flex-col gap-3">
              {referCases.map((c) => (
                <ReferCaseCard key={c.id} c={c} />
              ))}
            </ul>
          )}
        </section>
      )}
    </>
  );
}

function SectionHead({ title, range }: { title: string; range: string }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-2">
      <h2 className="text-[17px] font-bold">{title}</h2>
      <span className="text-[12.5px] text-(--muted)">{range}</span>
    </div>
  );
}

function Empty() {
  return (
    <p className="rounded-2xl bg-white py-6 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
      ไม่พบเคสในช่วงวันที่ที่เลือก
    </p>
  );
}

/** ฟอร์ม GET ธรรมดา — ช่วงวันที่อยู่ใน URL แชร์ลิงก์/กดย้อนกลับได้ */
function DateRangeForm({
  from,
  to,
  fromName,
  toName,
  preserve,
}: {
  from: string;
  to: string;
  fromName: string;
  toName: string;
  /** ช่วงวันที่ของอีกส่วนหนึ่ง — ไม่งั้นกดค้นส่วนนี้แล้วอีกส่วนเด้งกลับเป็นวันนี้ */
  preserve: Record<string, string>;
}) {
  return (
    <form className="mb-3 rounded-2xl bg-white p-3 shadow-(--card-shadow)">
      {Object.entries(preserve).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="flex items-end gap-2">
        <label className="block min-w-0 flex-1">
          <span className="mb-1 block text-[12px] text-(--muted)">จากวันที่</span>
          <input
            type="date"
            name={fromName}
            defaultValue={from}
            className="w-full rounded-xl border border-(--line) bg-(--page-bg) px-2.5 py-2"
          />
        </label>
        <label className="block min-w-0 flex-1">
          <span className="mb-1 block text-[12px] text-(--muted)">ถึงวันที่</span>
          <input
            type="date"
            name={toName}
            defaultValue={to}
            className="w-full rounded-xl border border-(--line) bg-(--page-bg) px-2.5 py-2"
          />
        </label>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-(--accent) px-3.5 py-2.5 text-sm font-semibold text-white"
        >
          แสดง
        </button>
      </div>
    </form>
  );
}
