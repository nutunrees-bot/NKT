"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import PhotoField from "@/components/ui/PhotoField";
import {
  ChipGroup,
  Field,
  MultiChipGroup,
  NameSelect,
  Section,
  SeverityPicker,
  SignaturePad,
  TimeField,
  TotalBox,
  inputClass,
} from "@/components/ui/controls";
import {
  emptyVitalSet,
  gcsTotal,
  minutesBetween,
  totalKm,
  type AttachmentUrls,
  type EmsFormValues,
} from "@/lib/domain/ems";
import type { Lookups } from "@/lib/domain/lookups";
import {
  DEATH_AT_SCENE,
  INCIDENT_TYPES,
  INITIAL_CARE_RESULTS,
  INSURANCE_RIGHTS,
  MULTI_GROUPS,
  NATIONALITIES,
  OUTCOMES,
  RECEIVED_FROM,
  SCENE_STATUSES,
  SEVERITIES,
  SHIFTS,
  TRAUMA_TYPES,
  groupsOf,
  type MultiGroupKey,
} from "@/lib/domain/options";

const DRAFT_KEY = "nkt_ems_draft";

export default function EmsForm({
  initial,
  lookups,
  caseId,
  seqPreview,
  attachmentUrls,
}: {
  initial: EmsFormValues;
  lookups: Lookups;
  /** ลิงก์ไฟล์แนบเดิม — ค่าใน values เก็บเป็น path ซึ่งแสดงเป็นรูปไม่ได้ */
  attachmentUrls?: AttachmentUrls;
  /** มีค่า = กำลังแก้ไขเคสเดิม */
  caseId?: string;
  /** เลข "เหตุที่" — ของเคสเดิม หรือเลขถัดไปที่ระบบจะออกให้ */
  seqPreview: number | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState<EmsFormValues>(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEdit = !!caseId;

  function set<K extends keyof EmsFormValues>(key: K, value: EmsFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  // ร่างที่กรอกค้างไว้ — เฉพาะเคสใหม่ กันกรอกกลางทางแล้วแอปถูกปิด
  // อ่านผ่าน useSyncExternalStore เพื่อให้ฝั่งเซิร์ฟเวอร์ได้ค่า null ไม่ชนตอน hydrate
  const savedDraft = useSyncExternalStore(
    () => () => {},
    () => (isEdit ? null : localStorage.getItem(DRAFT_KEY)),
    () => null,
  );
  const [draftDismissed, setDraftDismissed] = useState(false);
  const showDraftBanner = !!savedDraft && !draftDismissed && !isEdit;

  useEffect(() => {
    if (isEdit) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(values));
  }, [values, isEdit]);

  function restoreDraft() {
    if (!savedDraft) return;
    try {
      const draft = JSON.parse(savedDraft) as Partial<EmsFormValues>;
      setValues((prev) => ({ ...prev, ...draft }));
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    setDraftDismissed(true);
  }

  const notFound = values.scene_status === "ไม่พบเหตุ";
  const isDeathAtScene = values.initial_care_result === DEATH_AT_SCENE;
  const responseTime = minutesBetween(values.t_received, values.t_arrive_scene);
  const hospitalTime = minutesBetween(
    values.t_depart_scene,
    values.t_arrive_hospital,
  );
  const km = totalKm(values.mile_out, values.mile_station);

  /** เพิ่งวาด/ถ่ายใหม่ = data URL แสดงได้เลย · ไม่งั้นใช้ลิงก์ชั่วคราวของไฟล์เดิม */
  function attachmentSrc(field: keyof AttachmentUrls) {
    return values[field].startsWith("data:")
      ? values[field]
      : (attachmentUrls?.[field] ?? "");
  }

  function multiProps(key: MultiGroupKey) {
    const group = MULTI_GROUPS[key];
    const otherField = "otherField" in group ? group.otherField : undefined;
    return {
      label: group.label,
      options: group.options,
      values: values[key],
      onChange: (v: string[]) => set(key, v),
      otherText: otherField
        ? (values[otherField as keyof EmsFormValues] as string)
        : undefined,
      onOtherTextChange: otherField
        ? (v: string) =>
            set(otherField as keyof EmsFormValues, v as EmsFormValues[keyof EmsFormValues])
        : undefined,
    };
  }

  async function submit() {
    setError("");
    if (!values.incident_date) {
      setError("กรุณาเลือกวันที่");
      return;
    }
    startTransition(async () => {
      const { saveEmsCase } = await import("@/lib/actions/ems");
      const result = await saveEmsCase(values, caseId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (!isEdit) localStorage.removeItem(DRAFT_KEY);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      {showDraftBanner && (
        <div className="mb-3.5 flex items-center justify-between gap-2 rounded-xl border border-(--warn-line) bg-(--warn-soft) px-3 py-2.5 text-[13px] text-(--warn-ink)">
          <span>พบข้อมูลที่กรอกค้างไว้จากครั้งก่อน</span>
          <span className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={restoreDraft}
              className="rounded-lg border border-[#d8b46a] bg-white px-2.5 py-1.5 text-[12px]"
            >
              กู้คืน
            </button>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem(DRAFT_KEY);
                setDraftDismissed(true);
              }}
              className="rounded-lg border border-(--line) bg-white px-2.5 py-1.5 text-[12px]"
            >
              เริ่มใหม่
            </button>
          </span>
        </div>
      )}

      <Section title="ข้อมูลทั่วไป">
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="วันที่">
            <input
              type="date"
              value={values.incident_date}
              onChange={(e) => set("incident_date", e.target.value)}
              className={inputClass}
              required
            />
          </Field>
          <Field
            label="ลำดับ (เหตุที่)"
            hint={isEdit ? "เลขเดิมของเคสนี้" : "ระบบออกให้ตอนบันทึก"}
          >
            <input
              value={seqPreview ? `เหตุที่ ${seqPreview}` : "—"}
              readOnly
              className={`${inputClass} bg-[#f0f0f0] font-bold`}
            />
          </Field>
        </div>
        <Field label="เลขปฏิบัติการ">
          <input
            value={values.op_no}
            onChange={(e) => set("op_no", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="เวร">
          <ChipGroup
            options={SHIFTS}
            value={values.shift}
            onChange={(v) => set("shift", v)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="เจ้าหน้าที่ผู้ให้บริการ 1">
            <NameSelect
              options={lookups.providers}
              value={values.staff_provider1}
              onChange={(v) => set("staff_provider1", v)}
            />
          </Field>
          <Field label="เจ้าหน้าที่ผู้ให้บริการ 2">
            <NameSelect
              options={lookups.providers}
              value={values.staff_provider2}
              onChange={(v) => set("staff_provider2", v)}
            />
          </Field>
          <Field label="ผู้ช่วยเหลือ (PN/NA)">
            <NameSelect
              options={lookups.assistants}
              value={values.staff_helper}
              onChange={(v) => set("staff_helper", v)}
            />
          </Field>
          <Field label="เจ้าหน้าที่ (พขร.)">
            <NameSelect
              options={lookups.drivers}
              value={values.staff_driver}
              onChange={(v) => set("staff_driver", v)}
            />
          </Field>
        </div>
      </Section>

      <Section title="เหตุการณ์">
        <Field label="รับแจ้งจาก">
          <ChipGroup
            options={RECEIVED_FROM}
            value={values.received_from}
            onChange={(v) => set("received_from", v)}
          />
        </Field>
        <Field label="ประเภทเหตุการณ์">
          <ChipGroup
            options={INCIDENT_TYPES}
            value={values.incident_type}
            onChange={(v) => set("incident_type", v)}
          />
        </Field>
        <Field label="เหตุการณ์">
          <textarea
            value={values.incident_detail}
            onChange={(e) => set("incident_detail", e.target.value)}
            className={`${inputClass} min-h-14`}
          />
        </Field>
        <Field label="สถานที่">
          <input
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="เบอร์ผู้แจ้ง">
          <input
            type="tel"
            value={values.caller_phone}
            onChange={(e) => set("caller_phone", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="ระดับความรุนแรง">
          <SeverityPicker
            options={SEVERITIES}
            value={values.severity}
            onChange={(v) => set("severity", v)}
          />
        </Field>
        <Field label="ประเภท">
          <ChipGroup
            options={TRAUMA_TYPES}
            value={values.trauma_type}
            onChange={(v) => set("trauma_type", v)}
          />
        </Field>
        <Field
          label="พบเหตุ"
          hint={
            notFound
              ? "เลือก “ไม่พบเหตุ” — ส่วนข้อมูลผู้ป่วยลงไปถูกล็อกไว้"
              : undefined
          }
        >
          <ChipGroup
            options={SCENE_STATUSES}
            value={values.scene_status}
            onChange={(v) => set("scene_status", v)}
          />
        </Field>
      </Section>

      <Section title="เวลาปฏิบัติการ">
        <TimeField
          label="รับแจ้ง"
          value={values.t_received}
          onChange={(v) => set("t_received", v)}
        />
        <TimeField
          label="สั่งการ"
          value={values.t_dispatch}
          onChange={(v) => set("t_dispatch", v)}
        />
        <TimeField
          label="ออกฐาน"
          value={values.t_depart_station}
          onChange={(v) => set("t_depart_station", v)}
        />
        <TimeField
          label="ถึงเหตุ"
          value={values.t_arrive_scene}
          onChange={(v) => set("t_arrive_scene", v)}
        />
        <TimeField
          label="ออกเหตุ"
          value={values.t_depart_scene}
          onChange={(v) => set("t_depart_scene", v)}
        />
        <TimeField
          label="ถึง รพ."
          value={values.t_arrive_hospital}
          onChange={(v) => set("t_arrive_hospital", v)}
        />
        <TimeField
          label="ถึงฐาน"
          value={values.t_arrive_station}
          onChange={(v) => set("t_arrive_station", v)}
        />
        <TotalBox>
          Response time: {responseTime ?? "-"} นาที &nbsp;|&nbsp; Hospital Time:{" "}
          {hospitalTime ?? "-"} นาที
        </TotalBox>
      </Section>

      <Section title="เลขไมล์">
        <div className="grid grid-cols-2 gap-2.5">
          {(
            [
              ["mile_out", "ออก"],
              ["mile_scene", "ถึงเหตุ"],
              ["mile_hospital", "ถึง รพ."],
              ["mile_station", "ถึงฐาน"],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                type="number"
                step="0.1"
                inputMode="decimal"
                value={values[key]}
                onChange={(e) => set(key, e.target.value)}
                className={inputClass}
              />
            </Field>
          ))}
        </div>
        <TotalBox>ระยะทางรวม: {km ?? 0} กม.</TotalBox>
      </Section>

      <Section title="ข้อมูลผู้ป่วย" dimmed={notFound}>
        <Field label="ชื่อผู้ป่วย (พิมพ์คำนำหน้าด้วย เช่น นาย/นาง/นางสาว/เด็กชาย/เด็กหญิง)">
          <input
            value={values.patient_name}
            onChange={(e) => set("patient_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-3 gap-2.5">
          <Field label="อายุ (ปี)">
            <input
              type="number"
              inputMode="numeric"
              value={values.patient_age}
              onChange={(e) => set("patient_age", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="ID">
            <input
              value={values.patient_national_id}
              onChange={(e) => {
                set("patient_national_id", e.target.value);
                // กรอกเลขบัตรแล้วติ๊ก "คนไทย" ให้ ถ้ายังไม่ได้เลือกสัญชาติเอง
                if (e.target.value && !values.nationality) set("nationality", "คนไทย");
              }}
              className={inputClass}
            />
          </Field>
          <Field label="HN">
            <input
              value={values.patient_hn}
              onChange={(e) => set("patient_hn", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="ที่อยู่">
          <select
            value={values.address_subdistrict}
            onChange={(e) => set("address_subdistrict", e.target.value)}
            className={inputClass}
          >
            <option value="">— เลือกตำบล —</option>
            {lookups.subdistricts.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="สัญชาติ/ประเภทผู้ป่วย">
          <ChipGroup
            options={NATIONALITIES}
            value={values.nationality}
            onChange={(v) => {
              set("nationality", v);
              if (v === "คนไทย" || !v) set("nationality_detail", "");
            }}
          />
        </Field>
        {(values.nationality === "แรงงานต่างด้าว" ||
          values.nationality === "ชาวต่างชาติ") && (
          <Field label="ประเภทแรงงาน/สัญชาติ (ระบุ)">
            <input
              value={values.nationality_detail}
              onChange={(e) => set("nationality_detail", e.target.value)}
              className={inputClass}
            />
          </Field>
        )}
        <Field label="สิทธิการรักษา">
          <ChipGroup
            options={INSURANCE_RIGHTS}
            value={values.insurance_right}
            onChange={(v) => set("insurance_right", v)}
          />
        </Field>
        <Field
          label="อาการ"
          hint="ระบบเดิมมีช่องนี้ในทะเบียนแต่ไม่มีที่ให้กรอก — ฟอร์ม ALS กับข้อความสรุปดึงค่านี้ไปใช้"
        >
          <textarea
            value={values.symptoms}
            onChange={(e) => set("symptoms", e.target.value)}
            className={`${inputClass} min-h-14`}
          />
        </Field>
        <Field label="Dx (การวินิจฉัย)">
          <input
            value={values.dx}
            onChange={(e) => set("dx", e.target.value)}
            className={inputClass}
          />
        </Field>
      </Section>

      <Section title="Vital Signs" dimmed={notFound}>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="BP (mmHg)">
            <input
              value={values.bp}
              onChange={(e) => set("bp", e.target.value)}
              placeholder="เช่น 120/80"
              className={inputClass}
            />
          </Field>
          <Field label="PR (bpm)">
            <input
              type="number"
              inputMode="numeric"
              value={values.pr}
              onChange={(e) => set("pr", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="RR (bpm)">
            <input
              type="number"
              inputMode="numeric"
              value={values.rr}
              onChange={(e) => set("rr", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="BT (°C)">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={values.bt}
              onChange={(e) => set("bt", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="O2sat (%)">
          <input
            type="number"
            inputMode="numeric"
            value={values.o2sat}
            onChange={(e) => set("o2sat", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="GCS">
          <div className="grid grid-cols-3 gap-2.5">
            <input
              type="number"
              min={1}
              max={4}
              placeholder="E"
              value={values.gcs_e}
              onChange={(e) => set("gcs_e", e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              min={1}
              max={5}
              placeholder="V"
              value={values.gcs_v}
              onChange={(e) => set("gcs_v", e.target.value)}
              className={inputClass}
            />
            <input
              type="number"
              min={1}
              max={6}
              placeholder="M"
              value={values.gcs_m}
              onChange={(e) => set("gcs_m", e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="mt-1.5 text-[13px]">
            รวม GCS ={" "}
            <span className="font-bold text-(--blue)">
              {gcsTotal(values.gcs_e, values.gcs_v, values.gcs_m)}
            </span>
          </div>
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="Pupil ซ้าย (Lt)">
            <input
              value={values.pupil_l}
              onChange={(e) => set("pupil_l", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Pupil ขวา (Rt)">
            <input
              value={values.pupil_r}
              onChange={(e) => set("pupil_r", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="DTX (mg%)">
          <input
            type="number"
            inputMode="numeric"
            value={values.dtx}
            onChange={(e) => set("dtx", e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Treatment">
          <textarea
            value={values.treatment}
            onChange={(e) => set("treatment", e.target.value)}
            className={`${inputClass} min-h-14`}
          />
        </Field>

        {values.vitals.map((vs, i) => (
          <div
            key={i}
            className="mt-2 rounded-lg border border-dashed border-[#999] p-2"
          >
            <div className="mb-1 flex items-center justify-between">
              <strong className="text-[13px]">
                Vital Signs (ประเมินซ้ำ #{i + 1})
              </strong>
              <button
                type="button"
                onClick={() =>
                  set(
                    "vitals",
                    values.vitals.filter((_, idx) => idx !== i),
                  )
                }
                className="rounded-lg border border-(--line) bg-white px-2.5 py-1 text-[12px]"
              >
                🗑️ ลบชุดนี้
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  ["measured_at", "เวลา", "time"],
                  ["bp", "BP", "text"],
                  ["pr", "PR", "number"],
                  ["rr", "RR", "number"],
                  ["bt", "BT (°C)", "number"],
                  ["o2sat", "O2sat", "number"],
                  ["gcs_e", "GCS E", "number"],
                  ["gcs_v", "GCS V", "number"],
                  ["gcs_m", "GCS M", "number"],
                  ["pupil_l", "Pupil ซ้าย", "text"],
                  ["pupil_r", "Pupil ขวา", "text"],
                  ["dtx", "DTX", "number"],
                ] as const
              ).map(([key, label, type]) => (
                <Field key={key} label={label}>
                  <input
                    type={type}
                    step={key === "bt" ? "0.1" : undefined}
                    value={vs[key]}
                    onChange={(e) =>
                      set(
                        "vitals",
                        values.vitals.map((row, idx) =>
                          idx === i ? { ...row, [key]: e.target.value } : row,
                        ),
                      )
                    }
                    className={inputClass}
                  />
                </Field>
              ))}
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={() => set("vitals", [...values.vitals, emptyVitalSet()])}
          className="mt-1.5 rounded-lg border border-(--line) bg-white px-3 py-2 text-[13px]"
        >
          ➕ เพิ่มชุด Vital Signs (ประเมินซ้ำ)
        </button>
      </Section>

      {values.trauma_type === "Trauma" && !notFound && (
        <Section title="Trauma">
          {groupsOf("trauma").map((key) => (
            <MultiChipGroup key={key} {...multiProps(key)} />
          ))}
        </Section>
      )}

      {values.trauma_type === "Non-Trauma" && !notFound && (
        <Section title="Non-Trauma">
          {groupsOf("non-trauma").map((key) => (
            <MultiChipGroup key={key} {...multiProps(key)} />
          ))}
        </Section>
      )}

      <Section title="การช่วยเหลือ (Treatment)" dimmed={notFound}>
        {groupsOf("treatment").map((key) => (
          <MultiChipGroup key={key} {...multiProps(key)} />
        ))}
        <Field label="ผลการดูแลรักษาขั้นต้น">
          <ChipGroup
            options={INITIAL_CARE_RESULTS}
            value={values.initial_care_result}
            onChange={(v) => set("initial_care_result", v)}
          />
        </Field>

        {isDeathAtScene && (
          <div className="mb-3">
            <span className="mb-1 block text-[13px] text-(--muted)">
              ลายเซ็นญาติรับทราบการเสียชีวิต ณ จุดเกิดเหตุ
            </span>
            <SignaturePad
              value={attachmentSrc("death_signature")}
              onChange={(v) => set("death_signature", v)}
            />
            <Field label="ชื่อ-นามสกุล ญาติผู้เซ็นรับทราบ">
              <input
                value={values.death_signer_name}
                onChange={(e) => set("death_signer_name", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="รูปถ่ายยืนยัน (ถ่ายภาพหน้างาน)">
              <PhotoField
                value={attachmentSrc("death_photo")}
                onChange={(v) => set("death_photo", v)}
              />
            </Field>
          </div>
        )}

        <label className="mb-3 flex items-center gap-2 text-[13px]">
          <input
            type="checkbox"
            checked={values.palliative_care}
            onChange={(e) => set("palliative_care", e.target.checked)}
            className="size-[18px]"
          />
          รักษาประคับประคองตามอาการ (Palliative/Comfort Care)
        </label>

        {values.palliative_care && (
          <div className="mb-3">
            <span className="mb-1 block text-[13px] text-(--muted)">
              ลายเซ็นญาติรับทราบการรักษาแบบประคับประคองตามอาการ
            </span>
            <SignaturePad
              value={attachmentSrc("palliative_signature")}
              onChange={(v) => set("palliative_signature", v)}
            />
            <Field label="ชื่อ-นามสกุล ญาติผู้เซ็นรับทราบ">
              <input
                value={values.palliative_signer_name}
                onChange={(e) => set("palliative_signer_name", e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>
        )}
      </Section>

      <Section title="สรุปรายงาน" dimmed={notFound}>
        <Field label="ผู้สรุปรายงาน">
          <NameSelect
            options={lookups.providers}
            value={values.report_summarizer}
            onChange={(v) => set("report_summarizer", v)}
          />
        </Field>
        <Field label="ชื่อผู้ประเมิน (เฉพาะ RN)">
          <NameSelect
            options={lookups.rn}
            value={values.evaluator_name}
            onChange={(v) => set("evaluator_name", v)}
          />
        </Field>
      </Section>

      <Section title="ผลการรักษา" dimmed={notFound}>
        <ChipGroup
          options={OUTCOMES}
          value={values.outcome}
          onChange={(v) => set("outcome", v)}
        />
        {values.outcome === "Refer" && (
          <div className="mt-3">
            <Field label="ส่งต่อโรงพยาบาล">
              <input
                value={values.refer_hospital}
                onChange={(e) => set("refer_hospital", e.target.value)}
                list="refer-hospitals"
                className={inputClass}
              />
              <datalist id="refer-hospitals">
                {lookups.hospitals.map((h) => (
                  <option key={h} value={h} />
                ))}
              </datalist>
            </Field>
          </div>
        )}
      </Section>

      {error && (
        <p className="mb-3 rounded-lg bg-(--danger-soft) px-3 py-2.5 text-center text-[13px] text-(--danger)">
          {error}
        </p>
      )}

      {isEdit && (
        <p className="mb-2.5 rounded-xl border border-(--warn-line) bg-(--warn-soft) px-3 py-2.5 text-[13px] text-(--warn-ink)">
          ✏️ กำลังแก้ไขเคสเดิม — เลขลำดับและผู้บันทึกเดิมจะไม่ถูกเปลี่ยน
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={pending}
        className="w-full rounded-xl bg-linear-to-r from-(--navy) to-(--hivis-dark) px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {pending
          ? "กำลังบันทึก..."
          : isEdit
            ? "บันทึกการแก้ไข"
            : "บันทึกข้อมูล EMS"}
      </button>
    </>
  );
}
