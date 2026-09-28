/**
 * เวลาไทยเสมอ — เซิร์ฟเวอร์ (Vercel) รันเป็น UTC ถ้าใช้ new Date() ตรงๆ
 * เคสที่บันทึกหลังเที่ยงคืนตามเวลาไทยจะไปโผล่ผิดวัน
 */
const TZ = "Asia/Bangkok";

export function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function nowHM(): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

export function currentMonthISO(): string {
  return todayISO().slice(0, 7);
}

const THAI_MONTHS = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

/** "2026-09" -> "กันยายน 2569" */
export function thaiMonthLabel(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${THAI_MONTHS[m - 1]} ${y + 543}`;
}

/** "2026-09-11" -> "11/09/2569" (ฟอร์มราชการใช้ พ.ศ.) */
export function thaiDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${Number(m[1]) + 543}`;
}

export type ShiftName = "เช้า" | "บ่าย" | "ดึก";

/**
 * เวรของเหตุ — ดูจากเวลารับแจ้งก่อน (เช้า 08:00–15:59, บ่าย 16:00–23:59,
 * ดึก 00:00–07:59) ถ้าไม่ได้กรอกเวลาค่อยใช้ช่อง "เวร" ที่เจ้าหน้าที่เลือกไว้
 */
export function shiftOf(
  time: string | null | undefined,
  storedShift?: string | null,
): ShiftName | null {
  const m = time ? /^(\d{1,2}):/.exec(time) : null;
  if (m) {
    const h = Number(m[1]);
    if (h >= 8 && h < 16) return "เช้า";
    if (h >= 16) return "บ่าย";
    return "ดึก";
  }
  if (storedShift === "เช้า" || storedShift === "บ่าย" || storedShift === "ดึก")
    return storedShift;
  return null;
}

/** "2026-09-28" -> "วันจันทร์ที่ 28 กันยายน พ.ศ. 2569" */
export function thaiLongDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  // เที่ยงวัน UTC = วันเดียวกันในเวลาไทยเสมอ ไม่เลื่อนวัน
  const d = new Date(
    Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12),
  );
  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "full",
    timeZone: TZ,
  }).format(d);
}

/** "2026-09" -> "2026-08" / "2026-10" */
export function shiftMonth(ym: string, delta: number): string {
  const [y, m] = ym.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${String((total % 12) + 1).padStart(2, "0")}`;
}

/** "14:05:00" -> "14:05" */
export function hm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

/** "2026-09" -> "ก.ย.69" (ชื่อแท็บรายเดือนในชีตทะเบียน EMS ของ ER) */
export function thaiMonthShort(ym: string): string {
  const [y, m] = ym.split("-").map(Number);
  return `${THAI_MONTHS_SHORT[m - 1]}${String(y + 543).slice(-2)}`;
}

/** "2026-09" -> ["2026-09-01", "2026-09-30"] */
export function monthRange(ym: string): [string, string] {
  const [y, m] = ym.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return [`${ym}-01`, `${ym}-${String(last).padStart(2, "0")}`];
}

/** timestamptz -> "28 ก.ย. 2569 18:20" ตามเวลาไทย */
export function thaiDateTime(ts: string | null | undefined): string {
  if (!ts) return "-";
  const d = new Date(ts);
  const date = new Intl.DateTimeFormat("th-TH-u-ca-buddhist", {
    timeZone: TZ,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date} ${time}`;
}
