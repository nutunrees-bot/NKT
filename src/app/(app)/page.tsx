import Link from "next/link";
import DeleteCaseButton from "@/components/DeleteCaseButton";
import { deleteEmsCase, deleteReferCase } from "@/lib/actions/cases";
import { listEmsCases, listReferCases } from "@/lib/data/queries";
import { thaiDate, todayISO } from "@/lib/domain/datetime";

function one(v: string | string[] | undefined, fallback: string) {
  return (Array.isArray(v) ? v[0] : v) || fallback;
}

function accountCode(row: { accounts?: unknown }) {
  const a = Array.isArray(row.accounts) ? row.accounts[0] : row.accounts;
  return (a as { code?: string } | undefined)?.code ?? "-";
}

export default async function HomePage({ searchParams }: PageProps<"/">) {
  const sp = await searchParams;
  const today = todayISO();
  const eFrom = one(sp.e_from, today);
  const eTo = one(sp.e_to, today);
  const rFrom = one(sp.r_from, today);
  const rTo = one(sp.r_to, today);

  const [emsCases, referCases] = await Promise.all([
    listEmsCases(eFrom, eTo),
    listReferCases(rFrom, rTo),
  ]);

  return (
    <>
      <div className="mt-5 grid grid-cols-2 gap-3.5">
        <Link
          href="/ems/new"
          className="rounded-2xl border-2 border-[#ffcdd2] bg-(--card) px-3 py-7 text-center shadow-[0_2px_6px_rgba(0,0,0,.05)] active:scale-[.97]"
        >
          <div className="mb-2 text-[42px]">🚑</div>
          <h2 className="text-lg font-bold">EMS</h2>
          <p className="text-[12px] text-(--muted)">
            บันทึกปฏิบัติการรับ-ส่งผู้ป่วยฉุกเฉิน
          </p>
        </Link>
        <Link
          href="/refer/new"
          className="rounded-2xl border-2 border-[#bbdefb] bg-(--card) px-3 py-7 text-center shadow-[0_2px_6px_rgba(0,0,0,.05)] active:scale-[.97]"
        >
          <div className="mb-2 text-[42px]">👩‍⚕️</div>
          <h2 className="text-lg font-bold">REFER</h2>
          <p className="text-[12px] text-(--muted)">บันทึกการส่งต่อผู้ป่วย</p>
        </Link>
      </div>

      <section className="mt-4 rounded-2xl border border-(--line) bg-(--card) p-4">
        <div className="mb-3 flex items-center justify-between gap-2 border-b border-(--line) pb-2">
          <h3 className="text-sm font-semibold text-(--blue)">
            รายการเคส EMS (ดู / แก้ไข)
          </h3>
          <Link
            href="/print/als/blank"
            target="_blank"
            className="shrink-0 text-[12px] text-(--muted) underline"
          >
            พิมพ์ ALS เปล่า
          </Link>
        </div>
        <DateRangeForm
          from={eFrom}
          to={eTo}
          fromName="e_from"
          toName="e_to"
          preserve={{ r_from: rFrom, r_to: rTo }}
        />

        {emsCases.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-(--muted)">
            ไม่พบเคสในช่วงวันที่ที่เลือก
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {emsCases.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-(--line) bg-[#fafcfb] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-[13.5px] font-bold text-(--navy)">
                  <span>
                    <span className="mr-1 inline-block min-w-[22px] text-(--hivis-dark)">
                      {c.seq_no}.
                    </span>
                    {c.patient_name || "(ไม่ระบุชื่อ)"}
                  </span>
                  <span className="shrink-0 text-[12px] font-medium text-(--muted)">
                    {thaiDate(c.incident_date)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-(--muted)">
                  ระดับ: {c.severity || "-"} | ผลการรักษา:{" "}
                  {c.outcome || "-"} | ผู้บันทึก: {accountCode(c)}
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/ems/${c.id}`}
                    className="flex-1 rounded-lg border border-(--blue) bg-[#eaf3fb] px-3 py-2 text-center text-[12.5px] font-semibold text-(--blue)"
                  >
                    แก้ไข
                  </Link>
                  <Link
                    href={`/print/als/${c.id}`}
                    target="_blank"
                    className="flex-1 rounded-lg border border-(--hivis-dark) bg-(--hivis-soft) px-3 py-2 text-center text-[12.5px] font-semibold text-(--hivis-dark)"
                  >
                    พิมพ์ ALS
                  </Link>
                  <DeleteCaseButton
                    id={c.id}
                    action={deleteEmsCase}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-(--line) bg-(--card) p-4">
        <h3 className="mb-3 border-b border-(--line) pb-2 text-sm font-semibold text-(--blue)">
          รายการเคส REFER (ดู / แก้ไข)
        </h3>
        <DateRangeForm
          from={rFrom}
          to={rTo}
          fromName="r_from"
          toName="r_to"
          preserve={{ e_from: eFrom, e_to: eTo }}
        />

        {referCases.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-(--muted)">
            ไม่พบเคสในช่วงวันที่ที่เลือก
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {referCases.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-(--line) bg-[#fafcfb] px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2 text-[13.5px] font-bold text-(--navy)">
                  <span>{c.patient_name || "(ไม่ระบุชื่อ)"}</span>
                  <span className="shrink-0 text-[12px] font-medium text-(--muted)">
                    {thaiDate(c.refer_date)}
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-(--muted)">
                  ระดับ: {c.severity || "-"} | ส่งต่อ:{" "}
                  {c.refer_hospital || "-"} | ผู้บันทึก:{" "}
                  {accountCode(c)}
                </div>
                <div className="mt-2 flex gap-2">
                  <Link
                    href={`/refer/${c.id}`}
                    className="flex-1 rounded-lg border border-(--blue) bg-[#eaf3fb] px-3 py-2 text-center text-[12.5px] font-semibold text-(--blue)"
                  >
                    แก้ไข
                  </Link>
                  <Link
                    href={`/print/refer/${c.id}`}
                    target="_blank"
                    className="flex-1 rounded-lg border border-(--hivis-dark) bg-(--hivis-soft) px-3 py-2 text-center text-[12.5px] font-semibold text-(--hivis-dark)"
                  >
                    🖨️ พิมพ์ Refer
                  </Link>
                  <DeleteCaseButton
                    id={c.id}
                    action={deleteReferCase}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
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
    <form className="mb-2.5">
      {Object.entries(preserve).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="block">
          <span className="mb-1 block text-[13px] text-(--muted)">
            จากวันที่
          </span>
          <input
            type="date"
            name={fromName}
            defaultValue={from}
            className="w-full rounded-lg border border-(--line) bg-white px-2.5 py-2"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[13px] text-(--muted)">
            ถึงวันที่
          </span>
          <input
            type="date"
            name={toName}
            defaultValue={to}
            className="w-full rounded-lg border border-(--line) bg-white px-2.5 py-2"
          />
        </label>
      </div>
      <button
        type="submit"
        className="mt-2 mb-2.5 w-full rounded-lg border border-(--blue) bg-white px-3 py-2.5 text-sm font-semibold text-(--blue)"
      >
        แสดงรายการ
      </button>
    </form>
  );
}
