import { db } from "@/lib/supabase/admin";

/** ชื่อ -> บทบาท ใช้ต่อท้าย (RN)/(AEMT) ในฟอร์มพิมพ์ */
export async function getStaffRoles(): Promise<Map<string, string[]>> {
  const { data } = await db().from("staff").select("full_name, roles");
  return new Map(
    ((data ?? []) as { full_name: string; roles: string[] }[]).map((s) => [
      s.full_name,
      s.roles,
    ]),
  );
}
