"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

/**
 * Server action ถูกยิงตรงด้วย POST ได้ ไม่ใช่แค่ผ่านหน้าจอ —
 * ทุกตัวจึงต้องเช็ก session เองเสมอ
 */
async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่");
  return session;
}

export async function deleteEmsCase(id: string) {
  await requireSession();
  const { error } = await db().from("ems_cases").delete().eq("id", id);
  if (error) throw new Error(`ลบเคสไม่สำเร็จ: ${error.message}`);
  revalidatePath("/");
}

export async function deleteReferCase(id: string) {
  await requireSession();
  const { error } = await db().from("refer_cases").delete().eq("id", id);
  if (error) throw new Error(`ลบเคสไม่สำเร็จ: ${error.message}`);
  revalidatePath("/");
}
