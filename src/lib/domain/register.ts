import type { EmsRegisterRow } from "@/lib/data/queries";
import { shiftOf, thaiDate } from "@/lib/domain/datetime";

/**
 * ผังทะเบียนออกเหตุ EMS รายเดือน — ผังเดียวกับชีต "EMS69" ที่ ER พิมพ์มือ
 * (แท็บละเดือน "ก.ย.69", "ต.ค.69", ...) หัวตาราง 2 ชั้น แถวละ 1 เหตุ
 * ช่องแยกประเภทใส่เลข 1 ในช่องที่ตรง แถวล่างสุดรวมยอดแต่ละช่อง
 *
 * ใช้ร่วมกันทั้งไฟล์ Excel (register-xlsx.ts) และหน้าตาราง /register
 * — แก้ที่นี่ที่เดียว สองที่จะได้ตรงกันเสมอ
 *
 * หมายเหตุ: ชีตนี้คนละตัวกับชีต EMS_YYYY-MM ของระบบ GAS (ที่ตัวนำเข้า
 * legacy-sheet.ts อ่าน) — ผังคอลัมน์ถอดจากรูปชีตจริง A→X
 */

export type RegisterCell = string | number | null;

export type RegisterCol = {
  /** หัวชั้นบน (กลุ่ม) — ไม่มี = หัวคอลัมน์เดี่ยวคลุม 2 แถว */
  group?: string;
  label: string;
  /** ความกว้างคอลัมน์ใน Excel (หน่วยตัวอักษร) */
  width: number;
  /** ช่องนับ (ใส่ 1) — รวมยอดที่แถวล่าง */
  tally?: boolean;
  value: (r: EmsRegisterRow, i: number) => RegisterCell;
};

const one = (hit: boolean): RegisterCell => (hit ? 1 : null);

/** นาทีระหว่างสองเวลา (ข้ามเที่ยงคืน +24 ชม. เหมือนสูตร response time ใน DB) */
function minutesBetween(from: string | null, to: string | null): number | null {
  const toMin = (t: string | null) => {
    const m = t ? /^(\d{1,2}):(\d{2})/.exec(t) : null;
    return m ? Number(m[1]) * 60 + Number(m[2]) : null;
  };
  const a = toMin(from);
  const b = toMin(to);
  if (a === null || b === null) return null;
  return (b - a + 1440) % 1440;
}

/** ระยะทางจาก รพ. ถึงจุดเกิดเหตุ = ไมล์ถึงเหตุ − ไมล์ออก (สูตร "ไป" ของฟอร์ม ALS เดิม) */
function kmToScene(r: EmsRegisterRow): number | null {
  if (r.mile_out === null || r.mile_scene === null) return null;
  const km = Number(r.mile_scene) - Number(r.mile_out);
  return Number.isFinite(km) && km >= 0 ? km : null;
}

const staffOut = (r: EmsRegisterRow) =>
  [r.staff_provider1, r.staff_provider2].filter(Boolean).join(" / ") || null;

export const REGISTER_COLUMNS: RegisterCol[] = [
  { label: "ลำดับ", width: 6, value: (_r, i) => i + 1 },
  { label: "เลขปฏิบัติการ", width: 14, value: (r) => r.op_no },
  { label: "ศูนย์รับ/ผู้ออก", width: 18, value: staffOut },
  { label: "วันเดือนปี", width: 11, value: (r) => thaiDate(r.incident_date) },

  ...(["เช้า", "บ่าย", "ดึก"] as const).map<RegisterCol>((s) => ({
    group: "เวรออกเหตุ",
    label: s,
    width: 5,
    tally: true,
    value: (r) => one(shiftOf(r.t_received, r.shift) === s),
  })),

  { label: "ชื่อ-สกุล", width: 24, value: (r) => r.patient_name },
  { label: "HN", width: 10, value: (r) => r.patient_hn },
  { label: "อายุ", width: 5, value: (r) => r.patient_age },

  ...(["1669", "ER", "วิทยุ", "แจ้งที่ฐาน"] as const).map<RegisterCol>(
    (src) => ({
      group: "รับแจ้ง",
      label: src,
      width: src === "แจ้งที่ฐาน" ? 8 : 6,
      tally: true,
      // ระบบใหม่ยังไม่มีตัวเลือก "แจ้งที่ฐาน" — ช่องนี้จะว่างเสมอ
      value: (r) => one(r.received_from === src),
    }),
  ),

  ...(["พรบ", "อุบัติเหตุ", "ฉุกเฉิน"] as const).map<RegisterCol>((t) => ({
    group: "เหตุการณ์",
    label: t,
    width: t === "อุบัติเหตุ" ? 8 : 6,
    tally: true,
    value: (r) => one(r.incident_type === t),
  })),

  // Response time = ถึงเหตุ − รับแจ้ง (คอลัมน์ generated ใน DB)
  {
    group: "รับแจ้ง-ถึงเหตุ",
    label: "≤5 นาที",
    width: 7,
    tally: true,
    value: (r) => one(r.response_time_min !== null && r.response_time_min <= 5),
  },
  {
    group: "รับแจ้ง-ถึงเหตุ",
    label: "6-9 นาที",
    width: 7,
    tally: true,
    value: (r) =>
      one(
        r.response_time_min !== null &&
          r.response_time_min >= 6 &&
          r.response_time_min <= 9,
      ),
  },
  {
    group: "รับแจ้ง-ถึงเหตุ",
    label: "≥10 นาที",
    width: 7,
    tally: true,
    value: (r) =>
      one(r.response_time_min !== null && r.response_time_min >= 10),
  },

  // ออกจาก รพ. (ออกฐาน) → ถึงเหตุ
  {
    group: "ออก รพ.-เหตุ",
    label: "≤10 นาที",
    width: 7,
    tally: true,
    value: (r) => {
      const m = minutesBetween(r.t_depart_station, r.t_arrive_scene);
      return one(m !== null && m <= 10);
    },
  },
  {
    group: "ออก รพ.-เหตุ",
    label: ">10 นาที",
    width: 7,
    tally: true,
    value: (r) => {
      const m = minutesBetween(r.t_depart_station, r.t_arrive_scene);
      return one(m !== null && m > 10);
    },
  },

  {
    group: "จากเหตุระยะทาง",
    label: "≤10 กม.",
    width: 7,
    tally: true,
    value: (r) => {
      const km = kmToScene(r);
      return one(km !== null && km <= 10);
    },
  },
  {
    group: "จากเหตุระยะทาง",
    label: ">10 กม.",
    width: 7,
    tally: true,
    value: (r) => {
      const km = kmToScene(r);
      return one(km !== null && km > 10);
    },
  },
];

/** "ไม่พบเหตุ" ในชีตจริงกรอกแค่ ลำดับ/เลข/ทีม/วันที่/เวร แล้วเขียนไม่พบเหตุไว้ช่องชื่อ */
const NOT_FOUND_KEEP = new Set([
  "ลำดับ",
  "เลขปฏิบัติการ",
  "ศูนย์รับ/ผู้ออก",
  "วันเดือนปี",
]);

export const isNotFound = (r: EmsRegisterRow) => r.scene_status === "ไม่พบเหตุ";

/** ค่าทุกช่องของแถวที่ i (0-based) ตามผังทะเบียน */
export function registerRow(r: EmsRegisterRow, i: number): RegisterCell[] {
  const notFound = isNotFound(r);
  return REGISTER_COLUMNS.map((col) => {
    if (col.group === "เวรออกเหตุ" || !notFound) return col.value(r, i);
    if (col.label === "ชื่อ-สกุล") return "ไม่พบเหตุ";
    return NOT_FOUND_KEEP.has(col.label) ? col.value(r, i) : null;
  });
}

/** ยอดรวมแต่ละช่องนับ (null = ไม่ใช่ช่องนับ) — ไม่พบเหตุนับแค่เวร */
export function registerTotals(rows: EmsRegisterRow[]): (number | null)[] {
  return REGISTER_COLUMNS.map((col) =>
    col.tally
      ? rows.reduce((n, r, i) => {
          if (isNotFound(r) && col.group !== "เวรออกเหตุ") return n;
          return n + (col.value(r, i) === 1 ? 1 : 0);
        }, 0)
      : null,
  );
}

/** หัวชั้นบน: คอลัมน์เดี่ยว (คลุม 2 แถว) หรือกลุ่ม (คลุมหลายคอลัมน์) ตามลำดับ */
export function registerHeaderGroups(): {
  label: string;
  start: number;
  span: number;
  single: boolean;
}[] {
  const out: { label: string; start: number; span: number; single: boolean }[] =
    [];
  let c = 0;
  while (c < REGISTER_COLUMNS.length) {
    const col = REGISTER_COLUMNS[c];
    if (!col.group) {
      out.push({ label: col.label, start: c, span: 1, single: true });
      c++;
      continue;
    }
    let end = c;
    while (
      end + 1 < REGISTER_COLUMNS.length &&
      REGISTER_COLUMNS[end + 1].group === col.group
    )
      end++;
    out.push({ label: col.group, start: c, span: end - c + 1, single: false });
    c = end + 1;
  }
  return out;
}
