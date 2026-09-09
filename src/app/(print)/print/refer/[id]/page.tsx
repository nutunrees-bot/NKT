import { notFound } from "next/navigation";
import ReferPrint from "@/components/print/ReferPrint";
import { getReferCase } from "@/lib/data/queries";
import { db } from "@/lib/supabase/admin";

export default async function ReferPrintPage({
  params,
}: PageProps<"/print/refer/[id]">) {
  const { id } = await params;
  const row = await getReferCase(id);
  if (!row) notFound();

  const recorder = row.created_by
    ? await db()
        .from("accounts")
        .select("code")
        .eq("id", row.created_by)
        .maybeSingle()
    : { data: null };

  return (
    <ReferPrint row={row} recordedBy={(recorder.data?.code as string) ?? "-"} />
  );
}
