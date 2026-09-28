import ExcelJS from "exceljs";
import type { EmsRegisterRow } from "@/lib/data/queries";
import {
  shiftOf,
  thaiDate,
  thaiMonthLabel,
  thaiMonthShort,
} from "@/lib/domain/datetime";

/**
 * ทะเบียนออกเหตุ EMS รายเดือน — ผังเดียวกับชีต "EMS69" ที่ ER พิมพ์มือ
 * (แท็บละเดือน "ก.ย.69", "ต.ค.69", ...) หัวตาราง 2 ชั้น แถวละ 1 เหตุ
 * ช่องแยกประเภทใส่เลข 1 ในช่องที่ตรง แถวล่างสุดรวมยอดแต่ละช่อง
 *
 * หมายเหตุ: ชีตนี้คนละตัวกับชีต EMS_YYYY-MM ของระบบ GAS (ที่ตัวนำเข้า
 * legacy-sheet.ts อ่าน) — ผังคอลัมน์ถอดจากรูปชีตจริง A→X
 */

type Cell = string | number | null;

type Col = {
  /** หัวชั้นบน (กลุ่ม) — ไม่มี = หัวคอลัมน์เดี่ยวคลุม 2 แถว */
  group?: string;
  label: string;
  width: number;
  /** ช่องนับ (ใส่ 1) — รวมยอดที่แถวล่าง */
  tally?: boolean;
  value: (r: EmsRegisterRow, i: number) => Cell;
};

const one = (hit: boolean): Cell => (hit ? 1 : null);

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

const COLUMNS: Col[] = [
  { label: "ลำดับ", width: 6, value: (_r, i) => i + 1 },
  { label: "เลขปฏิบัติการ", width: 14, value: (r) => r.op_no },
  { label: "ศูนย์รับ/ผู้ออก", width: 18, value: staffOut },
  { label: "วันเดือนปี", width: 11, value: (r) => thaiDate(r.incident_date) },

  ...(["เช้า", "บ่าย", "ดึก"] as const).map<Col>((s) => ({
    group: "เวรออกเหตุ",
    label: s,
    width: 5,
    tally: true,
    value: (r) => one(shiftOf(r.t_received, r.shift) === s),
  })),

  { label: "ชื่อ-สกุล", width: 24, value: (r) => r.patient_name },
  { label: "HN", width: 10, value: (r) => r.patient_hn },
  { label: "อายุ", width: 5, value: (r) => r.patient_age },

  ...(["1669", "ER", "วิทยุ", "แจ้งที่ฐาน"] as const).map<Col>((src) => ({
    group: "รับแจ้ง",
    label: src,
    width: src === "แจ้งที่ฐาน" ? 8 : 6,
    tally: true,
    // ระบบใหม่ยังไม่มีตัวเลือก "แจ้งที่ฐาน" — ช่องนี้จะว่างเสมอ
    value: (r) => one(r.received_from === src),
  })),

  ...(["พรบ", "อุบัติเหตุ", "ฉุกเฉิน"] as const).map<Col>((t) => ({
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
      one(r.response_time_min !== null && r.response_time_min >= 6 && r.response_time_min <= 9),
  },
  {
    group: "รับแจ้ง-ถึงเหตุ",
    label: "≥10 นาที",
    width: 7,
    tally: true,
    value: (r) => one(r.response_time_min !== null && r.response_time_min >= 10),
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
const NOT_FOUND_KEEP = new Set(["ลำดับ", "เลขปฏิบัติการ", "ศูนย์รับ/ผู้ออก", "วันเดือนปี"]);

const FONT = "Tahoma";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFCFE2F3" }, // ฟ้าอ่อนแบบหัวตารางในชีตเดิม
};
const THIN: ExcelJS.Border = { style: "thin", color: { argb: "FF7F8C99" } };
const BORDER: Partial<ExcelJS.Borders> = {
  top: THIN,
  left: THIN,
  bottom: THIN,
  right: THIN,
};

export async function emsMonthlyRegisterWorkbook(
  ym: string,
  rows: EmsRegisterRow[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NKT Rescue";
  // ให้ Excel คำนวณสูตรแถวรวมใหม่ทุกครั้งที่เปิด (เผื่อแก้ตัวเลขในไฟล์ต่อ)
  wb.calcProperties.fullCalcOnLoad = true;

  const ws = wb.addWorksheet(thaiMonthShort(ym), {
    views: [{ state: "frozen", ySplit: 3, xSplit: 0 }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: { left: 0.3, right: 0.3, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2 },
      printTitlesRow: "2:3",
    },
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));
  const last = COLUMNS.length;

  // แถว 1: ชื่อทะเบียน
  ws.getCell(1, 1).value = `ทะเบียนออกเหตุ EMS เดือน ${thaiMonthLabel(ym)}`;
  ws.mergeCells(1, 1, 1, last);
  ws.getRow(1).height = 24;
  ws.getCell(1, 1).font = { name: FONT, size: 13, bold: true };
  ws.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };

  // แถว 2–3: หัวตาราง 2 ชั้น
  let c = 0;
  while (c < last) {
    const col = COLUMNS[c];
    if (!col.group) {
      ws.getCell(2, c + 1).value = col.label;
      ws.mergeCells(2, c + 1, 3, c + 1);
      c++;
      continue;
    }
    let end = c;
    while (end + 1 < last && COLUMNS[end + 1].group === col.group) end++;
    ws.getCell(2, c + 1).value = col.group;
    if (end > c) ws.mergeCells(2, c + 1, 2, end + 1);
    for (let k = c; k <= end; k++) ws.getCell(3, k + 1).value = COLUMNS[k].label;
    c = end + 1;
  }
  for (const r of [2, 3]) {
    ws.getRow(r).height = 20;
    for (let k = 1; k <= last; k++) {
      const cell = ws.getCell(r, k);
      cell.fill = HEADER_FILL;
      cell.border = BORDER;
      cell.font = { name: FONT, size: 10, bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle", wrapText: true };
    }
  }

  // ข้อมูล
  rows.forEach((row, i) => {
    const notFound = row.scene_status === "ไม่พบเหตุ";
    const values = COLUMNS.map((col) => {
      if (col.group === "เวรออกเหตุ") return col.value(row, i);
      if (notFound) {
        if (col.label === "ชื่อ-สกุล") return "ไม่พบเหตุ";
        return NOT_FOUND_KEEP.has(col.label) ? col.value(row, i) : null;
      }
      return col.value(row, i);
    });
    const excelRow = ws.addRow(values);
    excelRow.eachCell({ includeEmpty: true }, (cell, colNo) => {
      const col = COLUMNS[colNo - 1];
      cell.border = BORDER;
      cell.font = { name: FONT, size: 10 };
      const left = col.label === "ชื่อ-สกุล" || col.label === "ศูนย์รับ/ผู้ออก";
      cell.alignment = {
        horizontal: left ? "left" : "center",
        vertical: "middle",
      };
      // เลขปฏิบัติการ/HN เป็นข้อความ กัน Excel ตัดเลข 0 นำหน้า
      if (col.label === "เลขปฏิบัติการ" || col.label === "HN") cell.numFmt = "@";
    });
  });

  // แถวรวม
  const first = 4;
  const lastData = 3 + rows.length;
  const total = ws.addRow([]);
  total.getCell(1).value = "รวม";
  ws.mergeCells(total.number, 1, total.number, 4);
  COLUMNS.forEach((col, k) => {
    if (!col.tally) return;
    const letter = ws.getColumn(k + 1).letter;
    const sum = rows.reduce((n, r, i) => {
      if (r.scene_status === "ไม่พบเหตุ" && col.group !== "เวรออกเหตุ") return n;
      return n + (col.value(r, i) === 1 ? 1 : 0);
    }, 0);
    total.getCell(k + 1).value =
      rows.length > 0
        ? { formula: `SUM(${letter}${first}:${letter}${lastData})`, result: sum }
        : 0;
  });
  for (let k = 1; k <= last; k++) {
    const cell = total.getCell(k);
    cell.border = BORDER;
    cell.fill = HEADER_FILL;
    cell.font = { name: FONT, size: 10, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
