import Link from "next/link";
import {
  getDaySummary,
  listEmsCases,
  listReferCases,
} from "@/lib/data/queries";
import { thaiLongDate, todayISO } from "@/lib/domain/datetime";
import { Card } from "@/components/shell/ui";
import { ChevronRightIcon } from "@/components/shell/icons";
import { EmsCaseCard, ReferCaseCard } from "@/components/cases/CaseCards";

const SHIFT_TILES = [
  { key: "เช้า", short: "ช", range: "08:00–15:59" },
  { key: "บ่าย", short: "บ", range: "16:00–23:59" },
  { key: "ดึก", short: "ด", range: "00:00–07:59" },
] as const;

const TRIAGE = [
  { key: "สีแดง", label: "แดง", color: "var(--sev-red)" },
  { key: "สีเหลือง", label: "เหลือง", color: "var(--sev-yellow)" },
  { key: "สีเขียว", label: "เขียว", color: "var(--sev-green)" },
  { key: "สีดำ", label: "ดำ", color: "var(--sev-black)" },
] as const;

/** หน้าหลัก — สรุปการออกเหตุของวันนี้ + รายการเคสวันนี้ (เริ่มบันทึกจากปุ่มกลางแถบล่าง) */
export default async function HomePage() {
  const today = todayISO();
  const [{ ems, refer }, emsCases, referCases] = await Promise.all([
    getDaySummary(today),
    listEmsCases(today, today),
    listReferCases(today, today),
  ]);
  const white = ems.severity["สีขาว"] ?? 0;
  const noSeverity =
    ems.total - Object.values(ems.severity).reduce((a, b) => a + b, 0);

  return (
    <>
      <div className="mb-4">
        <h1 className="text-[24px] leading-tight font-bold">หน้าหลัก</h1>
        <p className="mt-0.5 text-[13px] text-(--muted)">
          {thaiLongDate(today)}
        </p>
      </div>

      {/* ยอดวันนี้ */}
      <Card className="p-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-[13px] text-(--muted)">วันนี้ออกเหตุ</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[40px] leading-none font-bold text-(--accent)">
                {ems.total}
              </span>
              <span className="text-[14px] text-(--muted)">ครั้ง</span>
            </div>
            {ems.notFound > 0 && (
              <div className="mt-1 text-[12px] text-(--muted)">
                (ไม่พบเหตุ {ems.notFound})
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[13px] text-(--muted)">Refer วันนี้</div>
            <div className="mt-1 text-[28px] leading-none font-bold">
              {refer.total}
            </div>
          </div>
        </div>

        {/* เวร ช/บ/ด */}
        <h2 className="mt-5 mb-2 text-[13px] font-semibold text-(--muted)">
          แยกตามเวร
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {SHIFT_TILES.map((s) => (
            <div key={s.key} className="rounded-xl bg-(--page-bg) px-3 py-2.5">
              <div className="flex items-center gap-1.5 text-[13px] font-semibold">
                <span className="flex size-5 items-center justify-center rounded-full bg-white text-[11px] text-(--accent)">
                  {s.short}
                </span>
                {s.key}
              </div>
              <div className="mt-1 text-[24px] leading-none font-bold">
                {ems.byShift[s.key]}
              </div>
              <div className="mt-1 text-[10.5px] text-(--muted)">{s.range}</div>
            </div>
          ))}
        </div>
        {ems.byShift["ไม่ระบุ"] > 0 && (
          <p className="mt-1.5 text-[11.5px] text-(--muted)">
            ไม่ได้กรอกเวลารับแจ้ง/เวร {ems.byShift["ไม่ระบุ"]} เคส
          </p>
        )}

        {/* Trauma / Non-trauma */}
        <h2 className="mt-5 mb-2 text-[13px] font-semibold text-(--muted)">
          ประเภท
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "Trauma", count: ems.trauma, color: "var(--accent)" },
            { label: "Non-trauma", count: ems.nonTrauma, color: "#1d5f99" },
          ].map((t) => (
            <div
              key={t.label}
              className="rounded-xl bg-(--page-bg) px-3 py-2.5"
            >
              <div className="flex items-baseline justify-between">
                <span className="text-[13px] font-semibold">{t.label}</span>
                <span className="text-[22px] leading-none font-bold">
                  {t.count}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${ems.total ? (t.count / ems.total) * 100 : 0}%`,
                    background: t.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* สีคัดแยก */}
        <h2 className="mt-5 mb-2 text-[13px] font-semibold text-(--muted)">
          ระดับความรุนแรง (สีคัดแยก)
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {TRIAGE.map((t) => (
            <div
              key={t.key}
              className="flex flex-col items-center rounded-xl bg-(--page-bg) py-2.5"
            >
              <span
                className="size-3.5 rounded-full ring-2 ring-white"
                style={{ background: t.color }}
              />
              <span className="mt-1.5 text-[22px] leading-none font-bold">
                {ems.severity[t.key] ?? 0}
              </span>
              <span className="mt-1 text-[11.5px] text-(--muted)">
                {t.label}
              </span>
            </div>
          ))}
        </div>
        {(white > 0 || noSeverity > 0) && (
          <p className="mt-1.5 text-[11.5px] text-(--muted)">
            {white > 0 && `สีขาว ${white} เคส`}
            {white > 0 && noSeverity > 0 && " · "}
            {noSeverity > 0 && `ไม่ระบุสี ${noSeverity} เคส`}
          </p>
        )}
      </Card>

      {/* รายการเคสวันนี้ — แสดงเลย ไม่ต้องกดเข้าไปดู */}
      <div className="mt-6 mb-2 flex items-baseline justify-between gap-2">
        <h2 className="text-[17px] font-bold">เคสวันนี้</h2>
        <Link
          href="/cases"
          className="flex items-center text-[12.5px] font-medium text-(--accent)"
        >
          ดูย้อนหลัง
          <ChevronRightIcon className="size-4" />
        </Link>
      </div>
      {emsCases.length + referCases.length === 0 ? (
        <p className="rounded-2xl bg-white py-6 text-center text-[13px] text-(--muted) shadow-(--card-shadow)">
          วันนี้ยังไม่มีเคส
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {emsCases.map((c) => (
            <EmsCaseCard key={c.id} c={c} big="seq" />
          ))}
          {referCases.map((c) => (
            <ReferCaseCard key={c.id} c={c} />
          ))}
        </ul>
      )}
    </>
  );
}
