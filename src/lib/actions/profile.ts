"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";

export type DisplayNameState = { error?: string; ok?: boolean };

const MAX_LEN = 60;

/** เจ้าหน้าที่ตั้ง/แก้ชื่อที่แสดงของบัญชีตัวเอง (แก้ได้เฉพาะบัญชีที่ login อยู่) */
export async function updateDisplayNameAction(
  _prev: DisplayNameState,
  formData: FormData,
): Promise<DisplayNameState> {
  const session = await getSession();
  if (!session) return { error: "หมดเวลาเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่" };

  const name = String(formData.get("display_name") ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (name.length > MAX_LEN) {
    return { error: `ชื่อยาวเกิน ${MAX_LEN} ตัวอักษร` };
  }

  const { error } = await db()
    .from("accounts")
    .update({ display_name: name || null })
    .eq("id", session.accountId);

  if (error) {
    console.error("[profile] update display_name failed:", error);
    return { error: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }

  // ชื่ออยู่บนหัวทุกหน้า — ล้าง cache ทั้งแอป
  revalidatePath("/", "layout");
  return { ok: true };
}
