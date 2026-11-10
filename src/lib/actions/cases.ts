"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getStaffSession } from "@/lib/auth/session";

/**
 * Server action ถูกยิงตรงด้วย POST ได้ ไม่ใช่แค่ผ่านหน้าจอ —
 * ทุกตัวจึงต้องเช็ก session เองเสมอ
 */
async function requireSession() {
  const session = await getStaffSession();
  if (!session) throw new Error("หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่");
  return session;
}

/**
 * เรียงเลข "เหตุที่" ของวันนั้นใหม่ให้ต่อกัน 1..N ตามลำดับเดิม
 * (ลบเหตุที่ 3 จาก 5 เคส → 4,5 เลื่อนเป็น 3,4) · ไล่จากเลขน้อยไปมาก
 * ช่องเป้าหมายจึงว่างเสมอ ไม่ชน unique (incident_date, seq_no)
 */
async function renumberEmsDay(date: string) {
  const { data, error } = await db()
    .from("ems_cases")
    .select("id, seq_no")
    .eq("incident_date", date)
    .order("seq_no", { ascending: true });
  if (error) throw new Error(`เรียงเลขเหตุใหม่ไม่สำเร็จ: ${error.message}`);

  for (const [i, row] of (data ?? []).entries()) {
    if (row.seq_no === i + 1) continue;
    const { error: upError } = await db()
      .from("ems_cases")
      .update({ seq_no: i + 1 })
      .eq("id", row.id);
    if (upError) throw new Error(`เรียงเลขเหตุใหม่ไม่สำเร็จ: ${upError.message}`);
  }
}

export async function deleteEmsCase(id: string) {
  await requireSession();
  const { data: deleted, error } = await db()
    .from("ems_cases")
    .delete()
    .eq("id", id)
    .select("incident_date")
    .maybeSingle();
  if (error) throw new Error(`ลบเคสไม่สำเร็จ: ${error.message}`);
  if (deleted?.incident_date) await renumberEmsDay(deleted.incident_date as string);
  revalidatePath("/", "layout");
}

export async function deleteReferCase(id: string) {
  await requireSession();
  const { error } = await db().from("refer_cases").delete().eq("id", id);
  if (error) throw new Error(`ลบเคสไม่สำเร็จ: ${error.message}`);
  revalidatePath("/", "layout");
}
