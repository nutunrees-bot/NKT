"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/supabase/admin";
import { getSession } from "@/lib/auth/session";
import { MULTI_KEYS } from "@/lib/domain/options";
import type { EmsFormValues, VitalSet } from "@/lib/domain/ems";
import { ATTACHMENT_BUCKET } from "@/lib/storage";

const txt = (v: string) => (v.trim() === "" ? null : v.trim());
const int = (v: string) => {
  const n = Number.parseInt(v, 10);
  return Number.isNaN(n) ? null : n;
};
const num = (v: string) => {
  const n = Number.parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

/**
 * ลายเซ็น/รูปถ่ายมาเป็น data URL เฉพาะตอนที่เพิ่งวาด/ถ่ายใหม่
 * ถ้าเป็นค่าเดิม (path ใน Storage) ให้คืนไปเลย ไม่อัปโหลดซ้ำ
 */
async function storeAttachment(
  caseId: string,
  name: string,
  value: string,
): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith("data:")) return value;

  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(value);
  if (!match) return null;

  const [, contentType, base64] = match;
  const ext = contentType.includes("png") ? "png" : "jpg";
  const path = `${caseId}/${name}-${Date.now()}.${ext}`;

  const { error } = await db()
    .storage.from(ATTACHMENT_BUCKET)
    .upload(path, Buffer.from(base64, "base64"), {
      contentType,
      upsert: true,
    });

  if (error) throw new Error(`อัปโหลดไฟล์แนบไม่สำเร็จ: ${error.message}`);
  return path;
}

function vitalRow(v: VitalSet, caseId: string, index: number) {
  return {
    case_id: caseId,
    sort_order: index,
    measured_at: txt(v.measured_at),
    bp: txt(v.bp),
    pr: int(v.pr),
    rr: int(v.rr),
    bt: num(v.bt),
    o2sat: int(v.o2sat),
    gcs_e: int(v.gcs_e),
    gcs_v: int(v.gcs_v),
    gcs_m: int(v.gcs_m),
    pupil_l: txt(v.pupil_l),
    pupil_r: txt(v.pupil_r),
    dtx: int(v.dtx),
  };
}

/** ค่าที่เก็บได้เลยโดยไม่ต้องรู้ id ของเคสก่อน (ไฟล์แนบต้องรอ id) */
function baseRow(f: EmsFormValues) {
  const multi = Object.fromEntries(MULTI_KEYS.map((k) => [k, f[k] ?? []]));

  return {
    incident_date: f.incident_date,
    op_no: txt(f.op_no),
    shift: txt(f.shift),
    staff_provider1: txt(f.staff_provider1),
    staff_provider2: txt(f.staff_provider2),
    staff_helper: txt(f.staff_helper),
    staff_driver: txt(f.staff_driver),

    received_from: txt(f.received_from),
    incident_type: txt(f.incident_type),
    incident_detail: txt(f.incident_detail),
    location: txt(f.location),
    caller_phone: txt(f.caller_phone),
    severity: txt(f.severity),
    trauma_type: txt(f.trauma_type),
    scene_status: txt(f.scene_status),

    t_received: txt(f.t_received),
    t_dispatch: txt(f.t_dispatch),
    t_depart_station: txt(f.t_depart_station),
    t_arrive_scene: txt(f.t_arrive_scene),
    t_depart_scene: txt(f.t_depart_scene),
    t_arrive_hospital: txt(f.t_arrive_hospital),
    t_arrive_station: txt(f.t_arrive_station),

    mile_out: num(f.mile_out),
    mile_scene: num(f.mile_scene),
    mile_hospital: num(f.mile_hospital),
    mile_station: num(f.mile_station),

    patient_name: txt(f.patient_name),
    patient_age: int(f.patient_age),
    patient_national_id: txt(f.patient_national_id),
    patient_hn: txt(f.patient_hn),
    address_subdistrict: txt(f.address_subdistrict),
    nationality: txt(f.nationality),
    nationality_detail: txt(f.nationality_detail),
    insurance_right: txt(f.insurance_right),
    symptoms: txt(f.symptoms),
    dx: txt(f.dx),

    bp: txt(f.bp),
    pr: int(f.pr),
    rr: int(f.rr),
    bt: num(f.bt),
    o2sat: int(f.o2sat),
    gcs_e: int(f.gcs_e),
    gcs_v: int(f.gcs_v),
    gcs_m: int(f.gcs_m),
    pupil_l: txt(f.pupil_l),
    pupil_r: txt(f.pupil_r),
    dtx: int(f.dtx),
    treatment: txt(f.treatment),

    ...multi,
    medical_other: txt(f.medical_other),
    obgyn_other: txt(f.obgyn_other),
    peds_other: txt(f.peds_other),
    surgical_other: txt(f.surgical_other),
    fluid_other: txt(f.fluid_other),

    initial_care_result: txt(f.initial_care_result),
    death_signer_name: txt(f.death_signer_name),
    palliative_care: f.palliative_care,
    palliative_signer_name: txt(f.palliative_signer_name),

    report_summarizer: txt(f.report_summarizer),
    evaluator_name: txt(f.evaluator_name),
    outcome: txt(f.outcome),
    refer_hospital: f.outcome === "Refer" ? txt(f.refer_hospital) : null,
  };
}

export async function saveEmsCase(
  values: EmsFormValues,
  caseId?: string,
): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) return { error: "หมดเวลาเข้าระบบ กรุณาเข้าสู่ระบบใหม่" };

  if (!values.incident_date) return { error: "กรุณาเลือกวันที่" };

  try {
    const row = baseRow(values);
    let id = caseId;

    if (id) {
      const { error } = await db()
        .from("ems_cases")
        .update({ ...row, updated_by: session.accountId })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      // เลข "เหตุที่" ออกจากฐานข้อมูล = max+1 ของวันนั้น ไม่ใช่การนับแถว
      // (ระบบเดิมนับแถว พอลบเคสกลางวันทิ้งแล้วเลขซ้ำ)
      const { data: seq, error: seqError } = await db().rpc("next_ems_seq", {
        p_date: values.incident_date,
      });
      if (seqError) throw new Error(seqError.message);

      const { data, error } = await db()
        .from("ems_cases")
        .insert({
          ...row,
          seq_no: seq as number,
          created_by: session.accountId,
          updated_by: session.accountId,
        })
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      id = data.id as string;
    }

    const [deathSignature, deathPhoto, palliativeSignature] = await Promise.all([
      storeAttachment(id, "death-signature", values.death_signature),
      storeAttachment(id, "death-photo", values.death_photo),
      storeAttachment(id, "palliative-signature", values.palliative_signature),
    ]);

    const { error: attachError } = await db()
      .from("ems_cases")
      .update({
        death_signature_path: deathSignature,
        death_photo_path: deathPhoto,
        palliative_signature_path: palliativeSignature,
      })
      .eq("id", id);
    if (attachError) throw new Error(attachError.message);

    // ชุดประเมินซ้ำ: ลบของเดิมแล้วใส่ชุดใหม่ทั้งก้อน ง่ายกว่าไล่เทียบทีละแถว
    await db().from("ems_vitals").delete().eq("case_id", id);
    if (values.vitals.length > 0) {
      const { error: vitalsError } = await db()
        .from("ems_vitals")
        .insert(values.vitals.map((v, i) => vitalRow(v, id!, i)));
      if (vitalsError) throw new Error(vitalsError.message);
    }

    revalidatePath("/");
    return {};
  } catch (e) {
    return {
      error: `บันทึกไม่สำเร็จ: ${e instanceof Error ? e.message : "ไม่ทราบสาเหตุ"}`,
    };
  }
}
