import { db } from "@/lib/supabase/admin";
import { ATTACHMENT_BUCKET } from "@/lib/storage";
import {
  emptyEmsForm,
  type AttachmentUrls,
  type EmsFormValues,
  type VitalSet,
} from "@/lib/domain/ems";
import { MULTI_KEYS } from "@/lib/domain/options";

type Row = Record<string, unknown>;

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const hhmm = (v: unknown) => s(v).slice(0, 5);

/** แถวจาก DB -> ค่าที่ฟอร์มใช้ (ทุกช่องเป็น string) */
export function rowToFormValues(row: Row): EmsFormValues {
  const base = emptyEmsForm(s(row.incident_date));

  const vitals: VitalSet[] = ((row.ems_vitals as Row[]) ?? [])
    .slice()
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
    .map((v) => ({
      measured_at: hhmm(v.measured_at),
      bp: s(v.bp),
      pr: s(v.pr),
      rr: s(v.rr),
      bt: s(v.bt),
      o2sat: s(v.o2sat),
      gcs_e: s(v.gcs_e),
      gcs_v: s(v.gcs_v),
      gcs_m: s(v.gcs_m),
      pupil_l: s(v.pupil_l),
      pupil_r: s(v.pupil_r),
      dtx: s(v.dtx),
    }));

  const multi = Object.fromEntries(
    MULTI_KEYS.map((k) => [k, (row[k] as string[]) ?? []]),
  );

  return {
    ...base,
    ...multi,
    incident_date: s(row.incident_date),
    op_no: s(row.op_no),
    shift: s(row.shift),
    staff_provider1: s(row.staff_provider1),
    staff_provider2: s(row.staff_provider2),
    staff_helper: s(row.staff_helper),
    staff_driver: s(row.staff_driver),

    received_from: s(row.received_from),
    incident_type: s(row.incident_type),
    incident_detail: s(row.incident_detail),
    location: s(row.location),
    caller_phone: s(row.caller_phone),
    severity: s(row.severity),
    trauma_type: s(row.trauma_type),
    scene_status: s(row.scene_status),

    t_received: hhmm(row.t_received),
    t_dispatch: hhmm(row.t_dispatch),
    t_depart_station: hhmm(row.t_depart_station),
    t_arrive_scene: hhmm(row.t_arrive_scene),
    t_depart_scene: hhmm(row.t_depart_scene),
    t_arrive_hospital: hhmm(row.t_arrive_hospital),
    t_arrive_station: hhmm(row.t_arrive_station),

    mile_out: s(row.mile_out),
    mile_scene: s(row.mile_scene),
    mile_hospital: s(row.mile_hospital),
    mile_station: s(row.mile_station),

    patient_name: s(row.patient_name),
    patient_age: s(row.patient_age),
    patient_national_id: s(row.patient_national_id),
    patient_hn: s(row.patient_hn),
    address_subdistrict: s(row.address_subdistrict),
    nationality: s(row.nationality),
    nationality_detail: s(row.nationality_detail),
    insurance_right: s(row.insurance_right),
    symptoms: s(row.symptoms),
    dx: s(row.dx),

    bp: s(row.bp),
    pr: s(row.pr),
    rr: s(row.rr),
    bt: s(row.bt),
    o2sat: s(row.o2sat),
    gcs_e: s(row.gcs_e),
    gcs_v: s(row.gcs_v),
    gcs_m: s(row.gcs_m),
    pupil_l: s(row.pupil_l),
    pupil_r: s(row.pupil_r),
    dtx: s(row.dtx),
    treatment: s(row.treatment),

    vitals,

    initial_care_result: s(row.initial_care_result),
    death_signer_name: s(row.death_signer_name),
    // เก็บ path เดิมไว้ใน values — ถ้าไม่ได้เซ็นใหม่จะบันทึกทับด้วย path เดิม
    death_signature: s(row.death_signature_path),
    death_photo: s(row.death_photo_path),
    palliative_care: row.palliative_care === true,
    palliative_signer_name: s(row.palliative_signer_name),
    palliative_signature: s(row.palliative_signature_path),

    report_summarizer: s(row.report_summarizer),
    evaluator_name: s(row.evaluator_name),
    outcome: s(row.outcome),
    refer_hospital: s(row.refer_hospital) || "รพ.นครไทย",
  };
}

/**
 * bucket เป็นแบบส่วนตัว — ต้องขอลิงก์ที่มีอายุจำกัดมาแสดง
 * (ระบบเดิมตั้งรูปผู้เสียชีวิตเป็น "ทุกคนที่มีลิงก์ดูได้" บน Drive)
 */
export async function signAttachments(row: Row): Promise<AttachmentUrls> {
  const entries: [keyof AttachmentUrls, string][] = [
    ["death_signature", s(row.death_signature_path)],
    ["death_photo", s(row.death_photo_path)],
    ["palliative_signature", s(row.palliative_signature_path)],
  ];

  const urls: AttachmentUrls = {};
  await Promise.all(
    entries.map(async ([key, path]) => {
      if (!path) return;
      const { data } = await db()
        .storage.from(ATTACHMENT_BUCKET)
        .createSignedUrl(path, 60 * 60);
      if (data?.signedUrl) urls[key] = data.signedUrl;
    }),
  );
  return urls;
}
