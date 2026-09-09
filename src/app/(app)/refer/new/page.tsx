import Link from "next/link";
import ReferForm from "@/components/refer/ReferForm";
import { getLookups } from "@/lib/data/queries";
import { emptyReferForm } from "@/lib/domain/refer";
import { todayISO } from "@/lib/domain/datetime";

export default async function NewReferPage() {
  const lookups = await getLookups();

  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-lg border border-(--line) bg-white px-3.5 py-2 text-sm"
        >
          ← กลับ
        </Link>
        <h2 className="text-lg font-bold">แบบบันทึก REFER</h2>
      </div>
      <ReferForm initial={emptyReferForm(todayISO())} lookups={lookups} />
    </>
  );
}
