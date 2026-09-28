import Link from "next/link";
import { listEmsRegister } from "@/lib/data/queries";
import {
  currentMonthISO,
  monthRange,
  shiftMonth,
  thaiMonthLabel,
} from "@/lib/domain/datetime";
import {
  REGISTER_COLUMNS,
  isNotFound,
  registerHeaderGroups,
  registerRow,
  registerTotals,
} from "@/lib/domain/register";
import { PageHeader } from "@/components/shell/ui";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SheetIcon,
} from "@/components/shell/icons";

/** คอลัมน์ข้อความที่ชิดซ้าย — ที่เหลือจัดกลาง */
const LEFT = new Set(["ชื่อ-สกุล", "ศูนย์รับ/ผู้ออก"]);

/**
 * ทะเบียนออกเหตุ EMS รายเดือนแบบตาราง — ผังเดียวกับไฟล์ Excel/ชีต EMS69
 * ตารางกว้างกว่าจอมือถือ เลื่อนซ้าย-ขวาได้ หัวตารางค้างไว้ตอนเลื่อนลง
 */
export default async function RegisterPage({
  searchParams,
}: PageProps<"/register">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ym) ? sp.ym[0] : sp.ym;
  const ym = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : currentMonthISO();

  const [from, to] = monthRange(ym);
  const rows = await listEmsRegister(from, to);
  const totals = registerTotals(rows);
  const groups = registerHeaderGroups();
  const found = rows.filter((r) => !isNotFound(r)).length;

  return (
    <>
      <PageHeader
        title="ทะเบียนออกเหตุ"
        subtitle={`${thaiMonthLabel(ym)} · ${rows.length} เหตุ (พบเหตุ ${found})`}
      />

      {/* เลือกเดือน */}
      <div className="mb-3 flex items-center gap-2 rounded-2xl bg-white p-2 shadow-(--card-shadow)">
        <Link
          href={`/register?ym=${shiftMonth(ym, -1)}`}
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
          href={`/register?ym=${shiftMonth(ym, 1)}`}
          aria-label="เดือนถัดไป"
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-(--page-bg)"
        >
          <ChevronRightIcon className="size-5" />
        </Link>
      </div>

      <a
        href={`/api/export/ems-month?ym=${ym}`}
        download
        className="mb-4 flex items-center justify-center gap-2 rounded-2xl bg-[#1d6f42] px-4 py-3 text-[14.5px] font-semibold text-white shadow-(--card-shadow) active:opacity-90"
      >
        <SheetIcon className="size-5" />
        ดาวน์โหลดเป็น Excel
      </a>

      {rows.length === 0 ? (
        <p className="rounded-2xl bg-white py-6 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
          ไม่มีเหตุในเดือนนี้
        </p>
      ) : (
        <div className="max-h-[70dvh] overflow-auto rounded-2xl bg-white shadow-(--card-shadow)">
          <table className="border-separate border-spacing-0 text-[12px] whitespace-nowrap">
            <thead className="sticky top-0 z-10 bg-[#cfe2f3] font-semibold">
              <tr>
                {groups.map((g) => (
                  <th
                    key={g.start}
                    colSpan={g.span}
                    rowSpan={g.single ? 2 : 1}
                    className="border-r border-b border-[#9fb6cc] px-2 py-1.5 text-center"
                  >
                    {g.label}
                  </th>
                ))}
              </tr>
              <tr>
                {REGISTER_COLUMNS.filter((c) => c.group).map((c) => (
                  <th
                    key={`${c.group}-${c.label}`}
                    className="border-r border-b border-[#9fb6cc] px-2 py-1.5 text-center"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const notFound = isNotFound(r);
                return (
                  <tr
                    key={`${r.incident_date}-${r.seq_no}`}
                    className={
                      notFound
                        ? "bg-(--warn-soft) text-(--muted)"
                        : i % 2
                          ? "bg-(--page-bg)"
                          : ""
                    }
                  >
                    {registerRow(r, i).map((v, k) => (
                      <td
                        key={k}
                        className={`border-r border-b border-(--line) px-2 py-1.5 ${
                          LEFT.has(REGISTER_COLUMNS[k].label)
                            ? "text-left"
                            : "text-center"
                        }`}
                      >
                        {v ?? ""}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-[#cfe2f3] font-bold">
              <tr>
                <td
                  colSpan={4}
                  className="border-r border-[#9fb6cc] px-2 py-1.5 text-center"
                >
                  รวม
                </td>
                {totals.slice(4).map((t, k) => (
                  <td
                    key={k}
                    className="border-r border-[#9fb6cc] px-2 py-1.5 text-center"
                  >
                    {t ?? ""}
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      <p className="mt-2 text-center text-[11px] text-(--muted)">
        เลื่อนตารางซ้าย-ขวาเพื่อดูคอลัมน์ทั้งหมด
      </p>
    </>
  );
}
