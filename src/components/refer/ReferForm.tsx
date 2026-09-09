"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChipGroup,
  Field,
  Section,
  SeverityPicker,
  inputClass,
} from "@/components/ui/controls";
import type { Lookups } from "@/lib/domain/lookups";
import type { ReferFormValues } from "@/lib/domain/refer";
import {
  REFER_SEVERITIES,
  REFER_TEAMS,
  TRAUMA_TYPES,
} from "@/lib/domain/options";

export default function ReferForm({
  initial,
  lookups,
  caseId,
}: {
  initial: ReferFormValues;
  lookups: Lookups;
  caseId?: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isEdit = !!caseId;

  function set<K extends keyof ReferFormValues>(
    key: K,
    value: ReferFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function submit() {
    setError("");
    if (!values.refer_date) {
      setError("กรุณาเลือกวันที่");
      return;
    }
    startTransition(async () => {
      const { saveReferCase } = await import("@/lib/actions/refer");
      const result = await saveReferCase(values, caseId);
      if (result?.error) {
        setError(result.error);
        return;
      }
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      <Section title="ข้อมูลผู้ป่วย">
        <Field label="วันที่">
          <input
            type="date"
            value={values.refer_date}
            onChange={(e) => set("refer_date", e.target.value)}
            className={inputClass}
            required
          />
        </Field>
        <Field label="ชื่อผู้ป่วย">
          <input
            value={values.patient_name}
            onChange={(e) => set("patient_name", e.target.value)}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-2.5">
          <Field label="HN">
            <input
              value={values.patient_hn}
              onChange={(e) => set("patient_hn", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="อายุ (ปี)">
            <input
              type="number"
              inputMode="numeric"
              value={values.patient_age}
              onChange={(e) => set("patient_age", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="DX">
          <textarea
            value={values.dx}
            onChange={(e) => set("dx", e.target.value)}
            className={`${inputClass} min-h-14`}
          />
        </Field>
      </Section>

      <Section title="การส่งต่อ">
        <Field label="ส่งต่อโรงพยาบาล">
          <input
            value={values.refer_hospital}
            onChange={(e) => set("refer_hospital", e.target.value)}
            list="refer-hospitals"
            placeholder="เลือกหรือพิมพ์ชื่อโรงพยาบาล"
            className={inputClass}
          />
          <datalist id="refer-hospitals">
            {lookups.hospitals.map((h) => (
              <option key={h} value={h} />
            ))}
          </datalist>
        </Field>
        <Field label="ประเภท">
          <ChipGroup
            options={TRAUMA_TYPES}
            value={values.trauma_type}
            onChange={(v) => set("trauma_type", v)}
          />
        </Field>
        <Field label="โดย (ทีมนำส่ง)">
          <ChipGroup
            options={REFER_TEAMS}
            value={values.team}
            onChange={(v) => set("team", v)}
          />
        </Field>
        <Field label="ระดับความรุนแรง">
          <SeverityPicker
            options={REFER_SEVERITIES}
            value={values.severity}
            onChange={(v) => set("severity", v)}
            stacked
          />
        </Field>
      </Section>

      {error && (
        <p className="mb-3 rounded-lg bg-(--danger-soft) px-3 py-2.5 text-center text-[13px] text-(--danger)">
          {error}
        </p>
      )}

      {isEdit && (
        <p className="mb-2.5 rounded-xl border border-(--warn-line) bg-(--warn-soft) px-3 py-2.5 text-[13px] text-(--warn-ink)">
          ✏️ กำลังแก้ไขเคสเดิม
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
            : "บันทึกข้อมูล REFER"}
      </button>
    </>
  );
}
