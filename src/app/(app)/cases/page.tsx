import Link from "next/link";
import { listEmsCases } from "@/lib/data/queries";
import { thaiDate, todayISO } from "@/lib/domain/datetime";
import { EmsCaseCard } from "@/components/cases/CaseCards";
import { PageHeader } from "@/components/shell/ui";
import { PrinterIcon } from "@/components/shell/icons";

function one(v: string | string[] | undefined, fallback: string) {
  return (Array.isArray(v) ? v[0] : v) || fallback;
}

function rangeLabel(from: string, to: string) {
  return from === to ? thaiDate(from) : `${thaiDate(from)} – ${thaiDate(to)}`;
}

/** รายการเคส EMS ตามช่วงวันที่ (ค่าเริ่มต้นวันนี้) — แก้ไข, พิมพ์ ALS, ALS เปล่า, ลบ */
export default async function CasesPage({ searchParams }: PageProps<"/cases">) {
  const sp = await searchParams;
  const today = todayISO();
  const eFrom = one(sp.e_from, today);
  const eTo = one(sp.e_to, today);

  const emsCases = await listEmsCases(eFrom, eTo);

  return (
    <>
      <PageHeader
        title="รายการเคส"
        subtitle={`EMS ${emsCases.length} เคส · ${rangeLabel(eFrom, eTo)}`}
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

      <DateRangeForm from={eFrom} to={eTo} />
      {emsCases.length === 0 ? (
        <p className="rounded-2xl bg-white py-6 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
          ไม่พบเคสในช่วงวันที่ที่เลือก
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {emsCases.map((c) => (
            <EmsCaseCard key={c.id} c={c} big="seq" />
          ))}
        </ul>
      )}
    </>
  );
}

/** ฟอร์ม GET ธรรมดา — ช่วงวันที่อยู่ใน URL แชร์ลิงก์/กดย้อนกลับได้ */
function DateRangeForm({ from, to }: { from: string; to: string }) {
  return (
    <form className="mb-3 rounded-2xl bg-white p-3 shadow-(--card-shadow)">
      <div className="flex items-end gap-2">
        <label className="block min-w-0 flex-1">
          <span className="mb-1 block text-[12px] text-(--muted)">จากวันที่</span>
          <input
            type="date"
            name="e_from"
            defaultValue={from}
            className="w-full rounded-xl border border-(--line) bg-(--page-bg) px-2.5 py-2"
          />
        </label>
        <label className="block min-w-0 flex-1">
          <span className="mb-1 block text-[12px] text-(--muted)">ถึงวันที่</span>
          <input
            type="date"
            name="e_to"
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
