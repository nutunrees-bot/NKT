/** ชนิดข้อมูลหน้า Ambulance / อุปกรณ์ EMS — ใช้ได้ทั้งฝั่งเซิร์ฟเวอร์และหน้าจอ (ไม่แตะฐานข้อมูล) */

export type Ambulance = {
  id: string;
  plate: string;
  status: string;
  statusUpdatedAt: string;
  statusUpdatedBy: string | null;
};

/** ใบตรวจอุปกรณ์ EMS — เช็คแยกเป็นหน้าของตัวเอง ไม่ผูกกับรถคันไหน */
export const EQUIPMENT_CATEGORY = "อุปกรณ์ EMS";

/** ใบตรวจที่เช็คกับรถแต่ละคัน — ลำดับนี้คือลำดับหัวข้อในใบเช็ค */
export const VEHICLE_CATEGORIES = [
  "อุปกรณ์และเวชภัณฑ์ประจำรถ",
  "กล่องยาฉุกเฉิน (กล่องที่ 1)",
] as const;

export type CheckItem = {
  id: string;
  category: string;
  name: string;
  /** จำนวนที่ต้องมี เช่น "3 amp" — ใบที่ไม่มีช่องจำนวน = null */
  qty: string | null;
};

/** ของ 1 รายการในใบเช็คที่บันทึกแล้ว (เก็บสำเนาไว้ แก้รายการทีหลังใบเก่าไม่เพี้ยน) */
export type CheckEntry = {
  category: string;
  name: string;
  qty: string | null;
  present: boolean;
};

/** ใบเช็ค 1 ใบ (1 วัน 1 เวร) */
export type CheckSheet = {
  id: string;
  date: string;
  shift: string;
  items: CheckEntry[];
  note: string | null;
  checkedBy: string | null;
  updatedAt: string;
};

export type AmbulanceCheck = CheckSheet & { ambulanceId: string };

/** key ของรายการ — ชื่อซ้ำข้ามใบได้ จึงต้องรวมหมวดด้วย */
export const entryKey = (e: { category: string; name: string }) =>
  `${e.category}|${e.name}`;

/** เรียงหมวดตามใบตรวจของ ER ก่อน หมวดที่เพิ่มเองต่อท้าย */
export function categoryOrder(cats: Iterable<string>): string[] {
  const order: string[] = [...VEHICLE_CATEGORIES, EQUIPMENT_CATEGORY];
  const all = [...new Set(cats)];
  const known = order.filter((c) => all.includes(c));
  return [...known, ...all.filter((c) => !known.includes(c))];
}
