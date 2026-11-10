import { db } from "@/lib/supabase/admin";
import {
  EQUIPMENT_CATEGORY,
  type Ambulance,
  type AmbulanceCheck,
  type CheckEntry,
  type CheckItem,
  type CheckSheet,
} from "@/lib/domain/ambulance";

/** ข้อมูลหน้า Ambulance / อุปกรณ์ EMS — อ่านผ่าน service_role ฝั่งเซิร์ฟเวอร์เท่านั้น */

type AccountRef = { code: string; display_name: string | null } | null;

function who(a: unknown): string | null {
  const one = (Array.isArray(a) ? a[0] : a) as AccountRef;
  return one ? one.display_name || one.code : null;
}

function toEntries(raw: unknown): CheckEntry[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Partial<CheckEntry>[]).map((e) => ({
    category: e.category ?? "",
    name: e.name ?? "",
    qty: e.qty ?? null,
    present: !!e.present,
  }));
}

type SheetRow = {
  id: string;
  check_date: string;
  shift: string;
  items: unknown;
  note: string | null;
  updated_at: string;
  accounts: unknown;
};

function toSheet(r: SheetRow): CheckSheet {
  return {
    id: r.id,
    date: r.check_date,
    shift: r.shift,
    items: toEntries(r.items),
    note: r.note,
    checkedBy: who(r.accounts),
    updatedAt: r.updated_at,
  };
}

const SHEET_COLS = "id, check_date, shift, items, note, updated_at, accounts(code, display_name)";

/** รายการของในใบเช็ค — vehicle = ใบที่เช็คกับรถ, equipment = ใบอุปกรณ์ EMS */
async function loadItems(kind: "vehicle" | "equipment"): Promise<CheckItem[]> {
  const q = db()
    .from("ambulance_check_items")
    .select("id, category, name, qty")
    .eq("is_active", true);
  const { data, error } = await (kind === "equipment"
    ? q.eq("category", EQUIPMENT_CATEGORY)
    : q.neq("category", EQUIPMENT_CATEGORY)
  )
    .order("sort_order")
    .order("name");
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    category: r.category,
    name: r.name,
    qty: r.qty,
  }));
}

export async function getAmbulanceData(sinceDate: string) {
  const [cars, checkItems, checks] = await Promise.all([
    db()
      .from("ambulances")
      .select("id, plate, status, status_updated_at, accounts(code, display_name)")
      .eq("is_active", true)
      .order("plate"),
    loadItems("vehicle"),
    db()
      .from("ambulance_checks")
      .select(`ambulance_id, ${SHEET_COLS}`)
      .gte("check_date", sinceDate)
      .order("check_date", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);
  if (cars.error) throw new Error(cars.error.message);
  if (checks.error) throw new Error(checks.error.message);

  const ambulances: Ambulance[] = (cars.data ?? []).map((r) => ({
    id: r.id,
    plate: r.plate,
    status: r.status,
    statusUpdatedAt: r.status_updated_at,
    statusUpdatedBy: who(r.accounts),
  }));

  const recentChecks: AmbulanceCheck[] = (checks.data ?? []).map((r) => ({
    ...toSheet(r as SheetRow),
    ambulanceId: (r as { ambulance_id: string }).ambulance_id,
  }));

  return { ambulances, checkItems, recentChecks };
}

export async function getEquipmentData(sinceDate: string) {
  const [checkItems, checks] = await Promise.all([
    loadItems("equipment"),
    db()
      .from("ems_equipment_checks")
      .select(SHEET_COLS)
      .gte("check_date", sinceDate)
      .order("check_date", { ascending: false })
      .order("updated_at", { ascending: false }),
  ]);
  if (checks.error) throw new Error(checks.error.message);
  return {
    checkItems,
    recentChecks: (checks.data ?? []).map((r) => toSheet(r as SheetRow)),
  };
}
