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

/** "14:05:00" -> "14:05" */
export function hm(time: string | null | undefined): string {
  return time ? time.slice(0, 5) : "";
}
