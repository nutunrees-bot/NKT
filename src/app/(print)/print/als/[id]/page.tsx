import { notFound } from "next/navigation";
import AlsForm from "@/components/print/AlsForm";
import { getEmsCase } from "@/lib/data/queries";
import { getStaffRoles } from "@/lib/data/staff-roles";
import { signAttachments } from "@/lib/data/ems-mapper";
import { db } from "@/lib/supabase/admin";

export default async function AlsPrintPage({
  params,
}: PageProps<"/print/als/[id]">) {
  const { id } = await params;
  const [row, roleByName] = await Promise.all([getEmsCase(id), getStaffRoles()]);
  if (!row) notFound();

  const [attachments, recorder] = await Promise.all([
    signAttachments(row),
    row.created_by
      ? db()
          .from("accounts")
          .select("code")
          .eq("id", row.created_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <AlsForm
      row={row}
      vitals={(row.ems_vitals as Record<string, unknown>[]) ?? []}
      attachments={attachments}
      roleByName={roleByName}
      recordedBy={(recorder.data?.code as string) ?? "-"}
    />
  );
}
