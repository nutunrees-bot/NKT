import type { EmsRegisterRow } from "@/lib/data/queries";
import { shiftOf, thaiDate } from "@/lib/domain/datetime";
import { DEATH_AT_SCENE } from "@/lib/domain/options";

/**
 * ผังทะเบียนออกเหตุ EMS รายเดือน — ผังเดียวกับชีต "EMS69" ที่ ER พิมพ์มือ
 * (แท็บละเดือน "ก.ย.69", "ต.ค.69", ...) หัวตาราง 2 ชั้น แถวละ 1 เหตุ
 * ช่องแยกประเภทใส่เลข 1 ในช่องที่ตรง แถวล่างสุดรวมยอดแต่ละช่อง
 *
 * ใช้ร่วมกันทั้งไฟล์ Excel (register-xlsx.ts) และหน้าตาราง /register
 * — แก้ที่นี่ที่เดียว สองที่จะได้ตรงกันเสมอ
 *
 * หมายเหตุ: ชีตนี้คนละตัวกับชีต EMS_YYYY-MM ของระบบ GAS (ที่ตัวนำเข้า
 * legacy-sheet.ts อ่าน) — ผังคอลัมน์ถอดจากแท็บ "ก.ย.69" ของไฟล์ EMS69 จริง (A→CL)
 * ช่องที่ระบบใหม่ไม่มีข้อมูล (แจ้งที่ฐาน, หมายเหตุ, สับถ่าย, จุดสับถ่าย) คงคอลัมน์ไว้แต่เว้นว่าง
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
  /** แถว "ไม่พบเหตุ" ยังกรอกช่องนี้ (ช่องอื่นเว้นว่าง) */
  keepWhenNotFound?: boolean;
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

/** ระดับความรุนแรงตามหัวชีต — ดำ/เสียชีวิต ณ จุดเกิดเหตุ = Death ก่อนเสมอ */
type Level = "Emergency" | "Urgency" | "Non-urgent" | "Death";
function levelOf(r: EmsRegisterRow): Level | null {
  if (r.severity === "สีดำ" || r.initial_care_result === DEATH_AT_SCENE)
    return "Death";
  if (r.severity === "สีแดง") return "Emergency";
  if (r.severity === "สีเหลือง") return "Urgency";
  if (r.severity === "สีเขียว" || r.severity === "สีขาว") return "Non-urgent";
  return null;
}
const LEVELS: { level: Level; label: string }[] = [
  { level: "Emergency", label: "Emergency" },
  { level: "Urgency", label: "Urgency" },
  { level: "Non-urgent", label: "Non-urgent" },
  { level: "Death", label: "Death ที่เกิดเหตุ" },
];

/** ตำบลเรียงตามหัวชีตเดิม (บ้านแยงอยู่ในชีต แม้รายการตำบลในระบบยังไม่มี) */
const SUBDISTRICTS = [
  "นครไทย",
  "หนองกระท้าว",
  "บ้านแยง",
  "นาบัว",
  "เนินเพิ่ม",
  "บ้านพร้าว",
  "บ่อโพธิ์",
  "ยางโกลน",
  "ห้วยเฮี้ย",
  "นครชุม",
  "น้ำกุ่ม",
  "นอกเขต",
];

/** ช่องที่ระบบใหม่ยังไม่มีข้อมูล — คงคอลัมน์ไว้ให้ผังตรงชีต */
const blank = () => null;

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

  // ชีตเดิมหัว "รับแจ้ง 5 นาที / 6-9 / 10" = รับแจ้ง → ออกรถ (เทียบกับเคส ก.ย.69 ที่กรอกมือแล้วตรง 21/22)
  ...(
    [
      ["≤5 นาที", (m: number) => m <= 5],
      ["6-9 นาที", (m: number) => m >= 6 && m <= 9],
      ["≥10 นาที", (m: number) => m >= 10],
    ] as const
  ).map<RegisterCol>(([label, hit]) => ({
    group: "รับแจ้ง-ออกรถ",
    label,
    width: 7,
    tally: true,
    value: (r) => {
      const m = minutesBetween(r.t_received, r.t_depart_station);
      return one(m !== null && hit(m));
    },
  })),

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

  // ชีตเดิม "ออกจากเหตุ (ระยะทาง ≤ 10km)" = เวลาอยู่ที่เกิดเหตุ: ถึงเหตุ → ออกจากเหตุ (ตรง 20/22)
  ...(
    [
      ["≤10 นาที", (m: number) => m <= 10],
      [">10 นาที", (m: number) => m > 10],
    ] as const
  ).map<RegisterCol>(([label, hit]) => ({
    group: "อยู่ที่เกิดเหตุ",
    label,
    width: 7,
    tally: true,
    value: (r) => {
      const m = minutesBetween(r.t_arrive_scene, r.t_depart_scene);
      return one(m !== null && hit(m));
    },
  })),

  { label: "หมายเหตุ", width: 12, value: blank },

  ...(["Trauma", "Non-Trauma"] as const).flatMap((t) =>
    LEVELS.map<RegisterCol>(({ level, label }) => ({
      group: t,
      label,
      width: level === "Death" ? 10 : 9,
      tally: true,
      value: (r) => one(r.trauma_type === t && levelOf(r) === level),
    })),
  ),

  ...(["ญาติ", "กู้ภัย"] as const).map<RegisterCol>((w) => ({
    group: "สับถ่าย",
    label: w,
    width: 6,
    tally: true,
    value: blank,
  })),
  { label: "จุดสับถ่าย", width: 14, value: blank },

  // ที่เกิดเหตุ × ระดับความรุนแรง (ชีตเดิมมี 4 ชุดหัวเดียวกัน เรียง Emergency/Urgency/Non-urgent/Death)
  ...LEVELS.flatMap(({ level }) =>
    SUBDISTRICTS.map<RegisterCol>((area) => ({
      group: `ที่เกิดเหตุ · ${level}`,
      label: area,
      width: 7,
      tally: true,
      value: (r) => one(levelOf(r) === level && r.address_subdistrict === area),
    })),
  ),

  {
    label: "ไม่พบเหตุ",
    width: 7,
    tally: true,
    keepWhenNotFound: true,
    value: (r) => one(r.scene_status === "ไม่พบเหตุ"),
  },
  {
    label: "ไม่ประสงค์ รพ.",
    width: 8,
    tally: true,
    value: (r) => one(r.scene_status === "ไม่ประสงค์ รพ."),
  },

  ...(
    [
      ["D/C", "D/C"],
      ["Admit", "Admit"],
      ["Refer", "Refer"],
      ["Death", "Death รพ."],
    ] as const
  ).map<RegisterCol>(([v, label]) => ({
    group: "ผลการรักษา",
    label,
    width: 7,
    tally: true,
    value: (r) => one(r.outcome === v),
  })),
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
    if (!notFound || col.group === "เวรออกเหตุ" || col.keepWhenNotFound)
      return col.value(r, i);
    if (col.label === "ชื่อ-สกุล") return "ไม่พบเหตุ";
    return NOT_FOUND_KEEP.has(col.label) ? col.value(r, i) : null;
  });
}

/** ยอดรวมแต่ละช่องนับ (null = ไม่ใช่ช่องนับ) — ไม่พบเหตุนับแค่เวร + ช่องไม่พบเหตุ */
export function registerTotals(rows: EmsRegisterRow[]): (number | null)[] {
  return REGISTER_COLUMNS.map((col) =>
    col.tally
      ? rows.reduce((n, r, i) => {
          if (
            isNotFound(r) &&
            col.group !== "เวรออกเหตุ" &&
            !col.keepWhenNotFound
          )
            return n;
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
