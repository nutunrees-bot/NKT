import ExcelJS from "exceljs";
import { MULTI_GROUPS, type MultiGroupKey } from "@/lib/domain/options";
import { hm, thaiDate } from "@/lib/domain/datetime";

/**
 * ดึงข้อมูลเคสเดียวเป็นไฟล์ Excel (.xlsx) — ชีตแนวตั้ง "หัวข้อ | ข้อมูล"
 * อ่านง่ายบนมือถือ/พิมพ์แนบแฟ้มได้ · ลายเซ็น/รูปถ่ายไม่ใส่ในไฟล์ (บอกแค่ว่ามี)
 * เพราะเป็นไฟล์ใน bucket ส่วนตัว ห้ามหลุดออกไปเป็นลิงก์ถาวร
 */

type Row = Record<string, unknown>;
type Field = [label: string, value: (r: Row) => unknown];

const s = (v: unknown) =>
  v === null || v === undefined || v === "" ? "" : Array.isArray(v) ? v.join(", ") : String(v);
const t = (k: string) => (r: Row) => hm(r[k] as string | null);
const v = (k: string) => (r: Row) => s(r[k]);
const has = (k: string) => (r: Row) => (r[k] ? "มี (ดูในระบบ)" : "");

/** กลุ่มติ๊กหลายค่า + ช่อง "Other" ของกลุ่มนั้น */
function multi(k: MultiGroupKey): Field {
  const g = MULTI_GROUPS[k];
  return [
    g.label,
    (r) => {
      const base = s(r[k]);
      const other = "otherField" in g ? s(r[g.otherField]) : "";
      return other ? `${base}${base ? " · " : ""}ระบุ: ${other}` : base;
    },
  ];
}

const EMS_SECTIONS: [string, Field[]][] = [
  [
    "ข้อมูลทั่วไป",
    [
      ["วันที่", (r) => thaiDate(r.incident_date as string)],
      ["ลำดับ (เหตุที่)", v("seq_no")],
      ["เลขปฏิบัติการ", v("op_no")],
      ["เวร", v("shift")],
      ["เจ้าหน้าที่ผู้ให้บริการ 1", v("staff_provider1")],
      ["เจ้าหน้าที่ผู้ให้บริการ 2", v("staff_provider2")],
      ["ผู้ช่วยเหลือ (PN/NA)", v("staff_helper")],
      ["พนักงานขับรถ", v("staff_driver")],
    ],
  ],
  [
    "เหตุการณ์",
    [
      ["รับแจ้งจาก", v("received_from")],
      ["ประเภทเหตุการณ์", v("incident_type")],
      ["เหตุการณ์", v("incident_detail")],
      ["สถานที่", v("location")],
      ["เบอร์ผู้แจ้ง", v("caller_phone")],
      ["ระดับความรุนแรง", v("severity")],
      ["ประเภท", v("trauma_type")],
      ["พบเหตุ", v("scene_status")],
    ],
  ],
  [
    "เวลาปฏิบัติการ",
    [
      ["รับแจ้ง", t("t_received")],
      ["สั่งการ", t("t_dispatch")],
      ["ออกฐาน", t("t_depart_station")],
      ["ถึงเหตุ", t("t_arrive_scene")],
      ["ออกเหตุ", t("t_depart_scene")],
      ["ถึง รพ.", t("t_arrive_hospital")],
      ["ถึงฐาน", t("t_arrive_station")],
      ["Response time (นาที)", v("response_time_min")],
      ["Hospital time (นาที)", v("hospital_time_min")],
    ],
  ],
  [
    "เลขไมล์",
    [
      ["ออก", v("mile_out")],
      ["ถึงเหตุ", v("mile_scene")],
      ["ถึง รพ.", v("mile_hospital")],
      ["ถึงฐาน", v("mile_station")],
      ["ระยะทางรวม (กม.)", v("total_km")],
    ],
  ],
  [
    "ข้อมูลผู้ป่วย",
    [
      ["ชื่อ-สกุล", v("patient_name")],
      ["อายุ", v("patient_age")],
      ["เลขบัตรประชาชน", v("patient_national_id")],
      ["HN", v("patient_hn")],
      ["ตำบล", v("address_subdistrict")],
      ["ที่อยู่ (นอกเขต)", v("address_detail")],
      ["สัญชาติ", v("nationality")],
      ["ระบุสัญชาติ", v("nationality_detail")],
      ["สิทธิการรักษา", v("insurance_right")],
      ["อาการ", v("symptoms")],
      ["Dx", v("dx")],
    ],
  ],
  [
    "Vital Signs (ชุดแรก)",
    [
      ["BP", v("bp")],
      ["PR", v("pr")],
      ["RR", v("rr")],
      ["BT", v("bt")],
      ["O2sat", v("o2sat")],
      [
        "GCS (E/V/M = รวม)",
        (r) =>
          r.gcs_e || r.gcs_v || r.gcs_m
            ? `E${s(r.gcs_e)} V${s(r.gcs_v)} M${s(r.gcs_m)} = ${s(r.gcs_total)}`
            : "",
      ],
      ["Pupil ซ้าย", v("pupil_l")],
      ["Pupil ขวา", v("pupil_r")],
      ["DTX", v("dtx")],
      ["Treatment", v("treatment")],
    ],
  ],
  ["Trauma", (["wound", "deform", "bleed", "organ"] as const).map(multi)],
  [
    "Non-Trauma",
    (["medical", "obgyn", "peds", "surgical", "other_nt"] as const).map(multi),
  ],
  [
    "การช่วยเหลือ",
    [
      ...(["airway", "wound_care", "fluid", "splint", "cpr"] as const).map(multi),
      ["ผลการดูแลรักษาขั้นต้น", v("initial_care_result")],
      ["ลายเซ็นญาติ (เสียชีวิต)", has("death_signature_path")],
      ["ชื่อญาติผู้เซ็น (เสียชีวิต)", v("death_signer_name")],
      ["รูปถ่ายยืนยัน", has("death_photo_path")],
      ["รักษาประคับประคอง (Palliative)", (r) => (r.palliative_care ? "ใช่" : "")],
      ["ลายเซ็นญาติ (Palliative)", has("palliative_signature_path")],
      ["ชื่อญาติผู้เซ็น (Palliative)", v("palliative_signer_name")],
    ],
  ],
  [
    "สรุปรายงาน / ผลการรักษา",
    [
      ["ผู้สรุปรายงาน", v("report_summarizer")],
      ["ชื่อผู้ประเมิน (RN)", v("evaluator_name")],
      ["ผลการรักษา", v("outcome")],
      ["ส่งต่อโรงพยาบาล", v("refer_hospital")],
    ],
  ],
];

const REFER_SECTIONS: [string, Field[]][] = [
  [
    "ข้อมูลการส่งต่อ",
    [
      ["วันที่", (r) => thaiDate(r.refer_date as string)],
      ["ชื่อ-สกุล", v("patient_name")],
      ["HN", v("patient_hn")],
      ["อายุ", v("patient_age")],
      ["Dx", v("dx")],
      ["ส่งต่อโรงพยาบาล", v("refer_hospital")],
      ["ประเภท", v("trauma_type")],
      ["ทีมนำส่ง", v("team")],
      ["ระดับความรุนแรง", v("severity")],
    ],
  ],
];

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.eachCell((c) => {
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD32F2F" } };
  });
}

function addKeyValueSheet(
  wb: ExcelJS.Workbook,
  name: string,
  title: string,
  sections: [string, Field[]][],
  row: Row,
) {
  const ws = wb.addWorksheet(name);
  ws.columns = [
    { key: "k", width: 32 },
    { key: "v", width: 60 },
  ];

  const titleRow = ws.addRow([title]);
  titleRow.font = { bold: true, size: 14 };
  ws.mergeCells(titleRow.number, 1, titleRow.number, 2);

  for (const [section, fields] of sections) {
    ws.addRow([]);
    const h = ws.addRow([section, ""]);
    styleHeader(h);
    for (const [label, get] of fields) {
      const r = ws.addRow([label, s(get(row))]);
      r.getCell(1).font = { bold: true };
      r.getCell(2).alignment = { wrapText: true, vertical: "top" };
    }
  }
  return ws;
}

export async function emsCaseWorkbook(row: Row): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NKT Rescue";
  addKeyValueSheet(
    wb,
    "EMS",
    `เคส EMS วันที่ ${thaiDate(row.incident_date as string)} เหตุที่ ${s(row.seq_no)}`,
    EMS_SECTIONS,
    row,
  );

  // ชุดประเมินซ้ำ (ตาราง ems_vitals) แยกชีต
  const vitals = ((row.ems_vitals as Row[]) ?? [])
    .slice()
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order));
  if (vitals.length) {
    const ws = wb.addWorksheet("V/S ประเมินซ้ำ");
    const cols = [
      ["เวลา", "measured_at"],
      ["BP", "bp"],
      ["PR", "pr"],
      ["RR", "rr"],
      ["BT", "bt"],
      ["O2sat", "o2sat"],
      ["GCS E", "gcs_e"],
      ["GCS V", "gcs_v"],
      ["GCS M", "gcs_m"],
      ["GCS รวม", "gcs_total"],
      ["Pupil ซ้าย", "pupil_l"],
      ["Pupil ขวา", "pupil_r"],
      ["DTX", "dtx"],
    ] as const;
    ws.columns = cols.map(([, key]) => ({ key, width: key === "measured_at" ? 10 : 9 }));
    styleHeader(ws.addRow(cols.map(([label]) => label)));
    for (const vs of vitals) {
      ws.addRow(
        cols.map(([, key]) => (key === "measured_at" ? hm(vs[key] as string) : s(vs[key]))),
      );
    }
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

export async function referCaseWorkbook(row: Row): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NKT Rescue";
  addKeyValueSheet(
    wb,
    "REFER",
    `เคส REFER วันที่ ${thaiDate(row.refer_date as string)}`,
    REFER_SECTIONS,
    row,
  );
  return Buffer.from(await wb.xlsx.writeBuffer());
}
