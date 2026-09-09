import Link from "next/link";
import { notFound } from "next/navigation";
import ReferForm from "@/components/refer/ReferForm";
import { getLookups, getReferCase } from "@/lib/data/queries";
import { referRowToFormValues } from "@/lib/domain/refer";

export default async function EditReferPage({
  params,
}: PageProps<"/refer/[id]">) {
  const { id } = await params;
  const [row, lookups] = await Promise.all([getReferCase(id), getLookups()]);
  if (!row) notFound();

  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-lg border border-(--line) bg-white px-3.5 py-2 text-sm"
        >
          ← กลับ
        </Link>
        <h2 className="text-lg font-bold">แก้ไขเคส REFER</h2>
      </div>
      <ReferForm
        initial={referRowToFormValues(row)}
        lookups={lookups}
        caseId={id}
      />
    </>
  );
}
