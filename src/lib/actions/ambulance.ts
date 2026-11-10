"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { AMBULANCE_STATUSES, SHIFTS } from "@/lib/domain/options";
import type { CheckEntry } from "@/lib/domain/ambulance";

/**
 * Server action ยิง POST ตรงได้ — ทุกตัวเช็ก session และตรวจค่าเองเสมอ
 * คืน { error } แทนการ throw ให้หน้าจอแจ้งผู้ใช้ได้
 */
type Result = { error?: string };

// รายการของใช้ร่วมกันทั้งสองหน้า แก้ที่หน้าไหนก็ต้องรีเฟรชทั้งคู่
const PAGES = ["/ambulance", "/equipment"];
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * who: "any" = ทั้งเจ้าหน้าที่และ พขร. (เปลี่ยนสถานะรถ, เช็คของในรถ)
 *      "staff" = เฉพาะเจ้าหน้าที่ ER (เพิ่ม/เอารถออก, แก้รายการของ, ใบอุปกรณ์ EMS)
 */
async function run(
  fn: (accountId: string) => Promise<void>,
  who: "any" | "staff" = "staff",
): Promise<Result> {
  const session = await getSession();
  if (!session) return { error: "หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่" };
  if (who === "staff" && session.role !== "staff")
    return { error: "บัญชี พขร. ทำรายการนี้ไม่ได้" };
  try {
    await fn(session.accountId);
    for (const p of PAGES) revalidatePath(p);
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

function check(error: { message: string; code?: string } | null, what: string) {
  if (!error) return;
  if (error.code === "23505") throw new Error(`${what}: มีอยู่แล้ว`);
  throw new Error(`${what}ไม่สำเร็จ: ${error.message}`);
}

export async function addAmbulance(plateRaw: string) {
  return run(async () => {
    const plate = plateRaw.trim().replace(/\s+/g, " ").slice(0, 40);
    if (!plate) throw new Error("กรุณากรอกเลขทะเบียนรถ");
    // เคยซ่อนรถทะเบียนนี้ไว้ = เปิดกลับมาใช้ ประวัติเช็คเดิมกลับมาด้วย
    const { data: existing } = await db()
      .from("ambulances")
      .select("id")
      .eq("plate", plate)
      .maybeSingle();
    if (existing) {
      const { error } = await db()
        .from("ambulances")
        .update({ is_active: true })
        .eq("id", existing.id);
      check(error, "เพิ่มรถ");
      return;
    }
    const { error } = await db().from("ambulances").insert({ plate });
    check(error, "เพิ่มรถ");
  });
}

export async function removeAmbulance(id: string) {
  return run(async () => {
    const { error } = await db()
      .from("ambulances")
      .update({ is_active: false })
      .eq("id", id);
    check(error, "เอารถออก");
  });
}

export async function setAmbulanceStatus(id: string, status: string) {
  return run(async (accountId) => {
    if (!AMBULANCE_STATUSES.some((s) => s.value === status))
      throw new Error("สถานะรถไม่ถูกต้อง");
    const { error } = await db()
      .from("ambulances")
      .update({
        status,
        status_updated_at: new Date().toISOString(),
        status_updated_by: accountId,
      })
      .eq("id", id);
    check(error, "เปลี่ยนสถานะรถ");
  }, "any");
}

export async function saveAmbulanceCheck(input: {
  ambulanceId: string;
  date: string;
  shift: string;
  items: CheckEntry[];
  note: string;
}) {
  return run(async (accountId) => {
    if (!input.ambulanceId) throw new Error("กรุณาเลือกรถ");
    const { error } = await db()
      .from("ambulance_checks")
      .upsert(
        {
          ambulance_id: input.ambulanceId,
          ...sheetRow(input, accountId),
        },
        { onConflict: "ambulance_id,check_date,shift" },
      );
    check(error, "บันทึกการเช็คของ");
  }, "any");
}

/** ใบตรวจอุปกรณ์ EMS — วันละ 1 ใบต่อเวร ไม่ผูกกับรถ */
export async function saveEquipmentCheck(input: {
  date: string;
  shift: string;
  items: CheckEntry[];
  note: string;
}) {
  return run(async (accountId) => {
    const { error } = await db()
      .from("ems_equipment_checks")
      .upsert(sheetRow(input, accountId), { onConflict: "check_date,shift" });
    check(error, "บันทึกการเช็คอุปกรณ์ EMS");
  });
}

/** ตรวจค่าที่ส่งมาจากหน้าจอ แล้วแปลงเป็นแถวใบเช็ค (ใช้ร่วมกันทั้งรถและอุปกรณ์ EMS) */
function sheetRow(
  input: { date: string; shift: string; items: CheckEntry[]; note: string },
  accountId: string,
) {
  if (!DATE_RE.test(input.date)) throw new Error("วันที่ไม่ถูกต้อง");
  if (!(SHIFTS as readonly string[]).includes(input.shift))
    throw new Error("กรุณาเลือกเวร");
  const str = (v: unknown, max: number) =>
    typeof v === "string" ? v.trim().slice(0, max) : "";
  const items = (Array.isArray(input.items) ? input.items : [])
    .filter((i) => str(i.name, 120))
    .slice(0, 300)
    .map((i) => ({
      category: str(i.category, 80),
      name: str(i.name, 120),
      qty: str(i.qty, 40) || null,
      present: !!i.present,
    }));
  return {
    check_date: input.date,
    shift: input.shift,
    items,
    note: str(input.note, 500) || null,
    checked_by: accountId,
  };
}

export async function addCheckItem(input: {
  category: string;
  name: string;
  qty: string;
}) {
  return run(async () => {
    const category = input.category.trim().slice(0, 80);
    const name = input.name.trim().slice(0, 120);
    const qty = input.qty.trim().slice(0, 40) || null;
    if (!category) throw new Error("กรุณาเลือกหมวด");
    if (!name) throw new Error("กรุณากรอกชื่อของ");
    // ต่อท้ายหมวดนั้น
    const { data: last } = await db()
      .from("ambulance_check_items")
      .select("sort_order")
      .eq("category", category)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await db()
      .from("ambulance_check_items")
      .upsert(
        {
          category,
          name,
          qty,
          is_active: true,
          sort_order: (last?.sort_order ?? 900) + 1,
        },
        { onConflict: "category,name" },
      );
    check(error, "เพิ่มรายการของ");
  });
}

export async function removeCheckItem(id: string) {
  return run(async () => {
    const { error } = await db()
      .from("ambulance_check_items")
      .update({ is_active: false })
      .eq("id", id);
    check(error, "เอารายการของออก");
  });
}
