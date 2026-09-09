"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import type { ReferFormValues } from "@/lib/domain/refer";

const txt = (v: string) => (v.trim() === "" ? null : v.trim());
const int = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};

export async function saveReferCase(
  values: ReferFormValues,
  caseId?: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่" };
  if (!values.refer_date) return { error: "กรุณาเลือกวันที่" };

  const row = {
    refer_date: values.refer_date,
    patient_name: txt(values.patient_name),
    patient_hn: txt(values.patient_hn),
    patient_age: int(values.patient_age),
    dx: txt(values.dx),
    refer_hospital: txt(values.refer_hospital),
    trauma_type: txt(values.trauma_type),
    team: txt(values.team),
    severity: txt(values.severity),
  };

  const { error } = caseId
    ? await db()
        .from("refer_cases")
        .update({ ...row, updated_by: session.accountId })
        .eq("id", caseId)
    : await db()
        .from("refer_cases")
        .insert({
          ...row,
          created_by: session.accountId,
          updated_by: session.accountId,
        });

  if (error) return { error: `บันทึกไม่สำเร็จ: ${error.message}` };

  revalidatePath("/");
  return {};
}
