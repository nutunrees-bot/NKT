import Link from "next/link";
import EmsForm from "@/components/ems/EmsForm";
import { getLookups, nextEmsSeq } from "@/lib/data/queries";
import { emptyEmsForm } from "@/lib/domain/ems";
import { todayISO } from "@/lib/domain/datetime";

export default async function NewEmsPage() {
  const today = todayISO();
  const [lookups, seq] = await Promise.all([getLookups(), nextEmsSeq(today)]);

  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-lg border border-(--line) bg-white px-3.5 py-2 text-sm"
        >
          ← กลับ
        </Link>
        <h2 className="text-lg font-bold">แบบบันทึก EMS</h2>
      </div>
      <EmsForm initial={emptyEmsForm(today)} lookups={lookups} seqPreview={seq} />
    </>
  );
}
