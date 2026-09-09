import { MULTI_KEYS, type MultiGroupKey } from "./options";

/** ลิงก์ชั่วคราวของไฟล์แนบที่บันทึกไว้แล้ว ใช้แค่แสดงผลในฟอร์ม/หน้าพิมพ์ */
export type AttachmentUrls = {
  death_signature?: string;
  death_photo?: string;
  palliative_signature?: string;
};

/** ชุดสัญญาณชีพ 1 ชุด (ชุดแรกอยู่ในเคส ชุดถัดไปคือการประเมินซ้ำ) */
export type VitalSet = {
  measured_at: string;
  bp: string;
  pr: string;
  rr: string;
  bt: string;
  o2sat: string;
  gcs_e: string;
  gcs_v: string;
  gcs_m: string;
  pupil_l: string;
  pupil_r: string;
  dtx: string;
};

export function emptyVitalSet(): VitalSet {
  return {
    measured_at: "",
    bp: "",
    pr: "",
    rr: "",
    bt: "",
    o2sat: "",
    gcs_e: "",
    gcs_v: "",
    gcs_m: "",
    pupil_l: "",
    pupil_r: "",
    dtx: "",
  };
}

/**
 * ค่าทุกช่องเก็บเป็น string ตามที่พิมพ์ในฟอร์ม (ยกเว้น multi-select กับ vitals)
 * แล้วค่อยแปลงชนิดตอนบันทึกฝั่งเซิร์ฟเวอร์ — กันปัญหา input ว่างกลายเป็น 0
 */
export type EmsFormValues = {
  incident_date: string;
  op_no: string;
  shift: string;
  staff_provider1: string;
  staff_provider2: string;
  staff_helper: string;
  staff_driver: string;

  received_from: string;
  incident_type: string;
  incident_detail: string;
  location: string;
  caller_phone: string;
  severity: string;
  trauma_type: string;
  scene_status: string;

  t_received: string;
  t_dispatch: string;
  t_depart_station: string;
  t_arrive_scene: string;
  t_depart_scene: string;
  t_arrive_hospital: string;
  t_arrive_station: string;

  mile_out: string;
  mile_scene: string;
  mile_hospital: string;
  mile_station: string;

  patient_name: string;
  patient_age: string;
  patient_national_id: string;
  patient_hn: string;
  address_subdistrict: string;
  nationality: string;
  nationality_detail: string;
  insurance_right: string;
  symptoms: string;
  dx: string;

  bp: string;
  pr: string;
  rr: string;
  bt: string;
  o2sat: string;
  gcs_e: string;
  gcs_v: string;
  gcs_m: string;
  pupil_l: string;
  pupil_r: string;
  dtx: string;
  treatment: string;

  vitals: VitalSet[];

  initial_care_result: string;
  death_signer_name: string;
  /** data URL ที่เพิ่งวาด/ถ่าย หรือ path เดิมใน Storage หรือ "" ถ้าไม่มี */
  death_signature: string;
  death_photo: string;
  palliative_care: boolean;
  palliative_signer_name: string;
  palliative_signature: string;

  report_summarizer: string;
  evaluator_name: string;
  outcome: string;
  refer_hospital: string;
} & Record<MultiGroupKey, string[]> & {
    medical_other: string;
    obgyn_other: string;
    peds_other: string;
    surgical_other: string;
    fluid_other: string;
  };

export function emptyEmsForm(incidentDate: string): EmsFormValues {
  const multi = Object.fromEntries(MULTI_KEYS.map((k) => [k, [] as string[]]));
  return {
    incident_date: incidentDate,
    op_no: "",
    shift: "",
    staff_provider1: "",
    staff_provider2: "",
    staff_helper: "",
    staff_driver: "",
    received_from: "",
    incident_type: "",
    incident_detail: "",
    location: "",
    caller_phone: "",
    severity: "",
    trauma_type: "",
    scene_status: "",
    t_received: "",
    t_dispatch: "",
    t_depart_station: "",
    t_arrive_scene: "",
    t_depart_scene: "",
    t_arrive_hospital: "",
    t_arrive_station: "",
    mile_out: "",
    mile_scene: "",
    mile_hospital: "",
    mile_station: "",
    patient_name: "",
    patient_age: "",
    patient_national_id: "",
    patient_hn: "",
    address_subdistrict: "",
    nationality: "",
    nationality_detail: "",
    insurance_right: "",
    symptoms: "",
    dx: "",
    bp: "",
    pr: "",
    rr: "",
    bt: "",
    o2sat: "",
    gcs_e: "",
    gcs_v: "",
    gcs_m: "",
    pupil_l: "",
    pupil_r: "",
    dtx: "",
    treatment: "",
    vitals: [],
    initial_care_result: "",
    death_signer_name: "",
    death_signature: "",
    death_photo: "",
    palliative_care: false,
    palliative_signer_name: "",
    palliative_signature: "",
    report_summarizer: "",
    evaluator_name: "",
    outcome: "",
    refer_hospital: "รพ.นครไทย",
    medical_other: "",
    obgyn_other: "",
    peds_other: "",
    surgical_other: "",
    fluid_other: "",
    ...multi,
  } as unknown as EmsFormValues;
}

/* --- ค่าที่คำนวณสด โชว์ให้เห็นระหว่างกรอก (สูตรเดียวกับที่ DB คำนวณตอนบันทึก) --- */

function toMinutes(hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})/.exec(hhmm);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

/** ติดลบ = ข้ามเที่ยงคืน บวก 24 ชม. กลับเข้าไป */
export function minutesBetween(from: string, to: string): number | null {
  const a = toMinutes(from);
  const b = toMinutes(to);
  if (a === null || b === null) return null;
  return (b - a + 1440) % 1440;
}

export function totalKm(mileOut: string, mileStation: string): number | null {
  const a = Number.parseFloat(mileOut);
  const b = Number.parseFloat(mileStation);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) * 100) / 100;
}

export function gcsTotal(e: string, v: string, m: string): number {
  return (
    (Number.parseInt(e, 10) || 0) +
    (Number.parseInt(v, 10) || 0) +
    (Number.parseInt(m, 10) || 0)
  );
}
