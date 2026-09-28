import Link from "next/link";
import DeleteCaseButton from "@/components/DeleteCaseButton";
import { deleteEmsCase, deleteReferCase } from "@/lib/actions/cases";
import type { EmsListItem, ReferListItem } from "@/lib/data/queries";
import { hm, thaiDate } from "@/lib/domain/datetime";
import {
  CaseCard,
  Tag,
  cardActionClass,
  severityColor,
  severityShort,
} from "@/components/shell/ui";
import { PencilIcon, PrinterIcon, SheetIcon } from "@/components/shell/icons";

function accountCode(row: { accounts?: unknown }) {
  const a = Array.isArray(row.accounts) ? row.accounts[0] : row.accounts;
  return (a as { code?: string } | undefined)?.code ?? "-";
}

/** HN · ID · อายุ — โชว์เฉพาะที่มีค่า */
function metaLine(parts: (string | null | undefined | false)[]) {
  const shown = parts.filter(Boolean);
  return shown.length ? shown.join(" · ") : "ไม่มีข้อมูล HN / อายุ";
}

const deleteClass =
  "rounded-md px-1.5 py-0.5 text-[11.5px] text-(--muted) hover:text-(--danger) disabled:opacity-50";

/** big = "seq" (รายการเคสรายวัน โชว์เลขเหตุที่) หรือ "age" (ทะเบียน โชว์อายุ) */
export function EmsCaseCard({
  c,
  big = "seq",
}: {
  c: EmsListItem;
  big?: "seq" | "age";
}) {
  const sev = severityShort(c.severity);
  return (
    <CaseCard
      sevColor={severityColor(c.severity)}
      title={c.patient_name || "(ไม่ระบุชื่อ)"}
      meta={metaLine([
        c.patient_hn && `HN ${c.patient_hn}`,
        c.patient_national_id && `ID ${c.patient_national_id}`,
        c.patient_age !== null && `${c.patient_age} ปี`,
      ])}
      tags={
        <>
          <Tag tone="red">EMS</Tag>
          <Tag>
            {thaiDate(c.incident_date)}
            {c.t_received && ` ${hm(c.t_received)}`}
          </Tag>
          {sev && <Tag>{sev}</Tag>}
          {c.trauma_type && <Tag tone="blue">{c.trauma_type}</Tag>}
          {c.scene_status && c.scene_status !== "พบเหตุ" && (
            <Tag tone="amber">{c.scene_status}</Tag>
          )}
          {c.outcome && <Tag tone="green">{c.outcome}</Tag>}
          {c.address_subdistrict && <Tag>ต.{c.address_subdistrict}</Tag>}
          <Tag>ผู้บันทึก {accountCode(c)}</Tag>
        </>
      }
      big={big === "seq" ? c.seq_no : (c.patient_age ?? "-")}
      bigLabel={big === "seq" ? "เหตุที่" : "ปี"}
      corner={
        <DeleteCaseButton id={c.id} action={deleteEmsCase} className={deleteClass} />
      }
      actions={[
        <Link key="e" href={`/ems/${c.id}`} className={cardActionClass}>
          <PencilIcon className="size-4" /> แก้ไข
        </Link>,
        <Link
          key="p"
          href={`/print/als/${c.id}`}
          target="_blank"
          className={cardActionClass}
        >
          <PrinterIcon className="size-4" /> พิมพ์ ALS
        </Link>,
        <a
          key="x"
          href={`/api/export/ems/${c.id}`}
          download
          className={`${cardActionClass} text-[#2e7d32]`}
        >
          <SheetIcon className="size-4" /> Excel
        </a>,
      ]}
    />
  );
}

export function ReferCaseCard({
  c,
  big = "age",
}: {
  c: ReferListItem;
  big?: "age" | "none";
}) {
  const sev = severityShort(c.severity);
  return (
    <CaseCard
      sevColor={severityColor(c.severity)}
      title={c.patient_name || "(ไม่ระบุชื่อ)"}
      meta={metaLine([
        c.patient_hn && `HN ${c.patient_hn}`,
        c.patient_age !== null && `${c.patient_age} ปี`,
      ])}
      tags={
        <>
          <Tag tone="blue">Refer</Tag>
          <Tag>{thaiDate(c.refer_date)}</Tag>
          {sev && <Tag>{sev}</Tag>}
          {c.trauma_type && <Tag tone="blue">{c.trauma_type}</Tag>}
          {c.refer_hospital && <Tag tone="green">→ {c.refer_hospital}</Tag>}
          <Tag>ผู้บันทึก {accountCode(c)}</Tag>
        </>
      }
      big={big === "age" ? (c.patient_age ?? "-") : undefined}
      bigLabel={big === "age" ? "ปี" : undefined}
      corner={
        <DeleteCaseButton id={c.id} action={deleteReferCase} className={deleteClass} />
      }
      actions={[
        <Link key="e" href={`/refer/${c.id}`} className={cardActionClass}>
          <PencilIcon className="size-4" /> แก้ไข
        </Link>,
        <Link
          key="p"
          href={`/print/refer/${c.id}`}
          target="_blank"
          className={cardActionClass}
        >
          <PrinterIcon className="size-4" /> พิมพ์ Refer
        </Link>,
        <a
          key="x"
          href={`/api/export/refer/${c.id}`}
          download
          className={`${cardActionClass} text-[#2e7d32]`}
        >
          <SheetIcon className="size-4" /> Excel
        </a>,
      ]}
    />
  );
}
