import Link from "next/link";
import { notFound } from "next/navigation";
import EmsForm from "@/components/ems/EmsForm";
import { getEmsCase, getLookups } from "@/lib/data/queries";
import { rowToFormValues, signAttachments } from "@/lib/data/ems-mapper";

export default async function EditEmsPage({ params }: PageProps<"/ems/[id]">) {
  const { id } = await params;
  const [row, lookups] = await Promise.all([getEmsCase(id), getLookups()]);
  if (!row) notFound();

  const attachmentUrls = await signAttachments(row);

  return (
    <>
      <div className="mb-3.5 flex items-center gap-2.5">
        <Link
          href="/"
          className="rounded-lg border border-(--line) bg-white px-3.5 py-2 text-sm"
        >
          ← กลับ
        </Link>
        <h2 className="text-lg font-bold">แก้ไขเคส EMS</h2>
      </div>
      <EmsForm
        initial={rowToFormValues(row)}
        lookups={lookups}
        caseId={id}
        seqPreview={row.seq_no as number}
        attachmentUrls={attachmentUrls}
      />
    </>
  );
}
