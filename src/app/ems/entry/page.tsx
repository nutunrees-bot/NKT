"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronLeft, Trash2 } from "lucide-react";
import {
  addEmsCase,
  listEmsCases,
  removeEmsCase,
  type EmsCase,
} from "@/lib/data/ems-repository";

const SHIFTS: { value: EmsCase["shift"]; label: string }[] = [
  { value: "morning", label: "เวรเช้า (08:00-16:00)" },
  { value: "afternoon", label: "เวรบ่าย (16:00-24:00)" },
  { value: "night", label: "เวรดึก (24:00-08:00)" },
];

const CHANNELS: { value: EmsCase["channel"]; label: string }[] = [
  { value: "1669", label: "1669" },
  { value: "er_phone", label: "เบอร์ห้องฉุกเฉิน" },
  { value: "radio", label: "วิทยุ" },
  { value: "other", label: "อื่นๆ/แจ้งฐาน" },
];

const CATEGORIES: { value: EmsCase["category"]; label: string }[] = [
  { value: "general_accident", label: "อุบัติเหตุทั่วไป / จราจร" },
  { value: "traffic_victim_act", label: "ผู้ป่วย พรบ. ผู้ประสบภัยจากรถ" },
  { value: "critical_illness", label: "ผู้ป่วยฉุกเฉินวิกฤต/โรคทั่วไป" },
];

const SEVERITIES: { value: EmsCase["severity"]; label: string; color: string }[] = [
  { value: "red", label: "สีแดง (Emergency)", color: "var(--triage-red)" },
  { value: "yellow", label: "สีเหลือง (Urgency)", color: "var(--triage-yellow)" },
  { value: "green", label: "สีเขียว (Non-Urgent)", color: "var(--triage-green)" },
  { value: "death_onsite", label: "เสียชีวิต ณ ที่เกิดเหตุ", color: "var(--text-muted)" },
];

const OUTCOMES: { value: EmsCase["outcome"]; label: string }[] = [
  { value: "", label: "— ยังไม่ระบุ —" },
  { value: "discharge", label: "D/C (จำหน่ายกลับบ้านจากห้องฉุกเฉิน)" },
  { value: "admit", label: "Admit (รับไว้รักษาในหอผู้ป่วย)" },
  { value: "refer", label: "Refer (ส่งต่อโรงพยาบาลอื่น)" },
  { value: "death", label: "เสียชีวิต" },
];

const EMPTY_FORM = {
  incidentDate: new Date().toISOString().slice(0, 10),
  incidentTime: "",
  shift: "morning" as EmsCase["shift"],
  channel: "1669" as EmsCase["channel"],
  category: "general_accident" as EmsCase["category"],
  severity: "green" as EmsCase["severity"],
  isTrauma: false,
  location: "",
  patientInitials: "",
  patientHn: "",
  patientAge: "",
  outcome: "" as EmsCase["outcome"],
  noIncident: false,
  noIncidentReason: "",
  notes: "",
};

function labelFor<T extends { value: string; label: string }>(
  options: T[],
  value: string,
) {
  return options.find((o) => o.value === value)?.label ?? value;
}

export default function EmsEntryPage() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [recent, setRecent] = useState<EmsCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    listEmsCases()
      .then(setRecent)
      .catch((err) => setError(err.message ?? "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await addEmsCase({
        incidentDate: form.incidentDate,
        incidentTime: form.incidentTime,
        shift: form.shift,
        channel: form.channel,
        category: form.category,
        severity: form.severity,
        isTrauma: form.isTrauma,
        location: form.location,
        patientInitials: form.patientInitials,
        patientHn: form.patientHn,
        patientAge: form.patientAge ? Number(form.patientAge) : null,
        outcome: form.outcome,
        noIncident: form.noIncident,
        noIncidentReason: form.noIncidentReason,
        notes: form.notes,
      });
      setRecent(await listEmsCases());
      setForm({ ...EMPTY_FORM, incidentDate: form.incidentDate });
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await removeEmsCase(id);
      setRecent(await listEmsCases());
    } catch (err) {
      setError(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:py-6">
      <Link
        href="/"
        className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-(--text-secondary) hover:text-(--brand-navy)"
      >
        <ChevronLeft size={14} /> กลับไป EMS Command Center
      </Link>

      <div className="mb-4">
        <h2 className="text-lg font-bold text-(--text-primary) sm:text-xl">
          บันทึกเคส EMS ใหม่
        </h2>
        <p className="text-xs text-(--text-secondary)">
          บันทึกเข้าฐานข้อมูลกลาง (Supabase) โดยตรง — ทุกคนที่เข้าเว็บนี้เห็นข้อมูลชุดเดียวกัน
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-(--status-critical) bg-(--status-critical)/10 px-3 py-2 text-xs font-medium text-(--status-critical)">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm sm:p-6"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="วัน/เดือน/ปี ที่เกิดเหตุ" required>
            <input
              type="date"
              required
              value={form.incidentDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, incidentDate: e.target.value }))
              }
              className="input"
            />
          </Field>
          <Field label="เวลาที่เกิดเหตุ">
            <input
              type="time"
              value={form.incidentTime}
              onChange={(e) =>
                setForm((f) => ({ ...f, incidentTime: e.target.value }))
              }
              className="input"
            />
          </Field>
        </div>

        <Field label="เวรปฏิบัติงาน" required>
          <PillGroup
            options={SHIFTS}
            value={form.shift}
            onChange={(v) => setForm((f) => ({ ...f, shift: v }))}
          />
        </Field>

        <Field label="ช่องทางการรับแจ้งเหตุ" required>
          <PillGroup
            options={CHANNELS}
            value={form.channel}
            onChange={(v) => setForm((f) => ({ ...f, channel: v }))}
          />
        </Field>

        <Field label="หมวดหมู่เคส" required>
          <PillGroup
            options={CATEGORIES}
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-(--text-primary)">
          <input
            type="checkbox"
            checked={form.noIncident}
            onChange={(e) =>
              setForm((f) => ({ ...f, noIncident: e.target.checked }))
            }
            className="h-4 w-4 accent-(--brand-navy)"
          />
          ไม่พบเหตุ / ผู้ป่วยปฏิเสธการรักษา
        </label>

        {form.noIncident ? (
          <Field label="เหตุผล (ไม่พบเหตุ / ปฏิเสธการรักษา)">
            <input
              type="text"
              placeholder="เช่น ไม่ประสงค์ให้นำส่ง, ยกเลิกกิจกรรม"
              value={form.noIncidentReason}
              onChange={(e) =>
                setForm((f) => ({ ...f, noIncidentReason: e.target.value }))
              }
              className="input"
            />
          </Field>
        ) : (
          <>
            <Field label="ระดับความเร่งด่วน ณ จุดเกิดเหตุ" required>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SEVERITIES.map((s) => {
                  const active = form.severity === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, severity: s.value }))
                      }
                      className="flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-left text-xs font-medium transition-colors"
                      style={{
                        borderColor: active ? s.color : "var(--border-hairline)",
                        backgroundColor: active ? `${s.color}14` : "transparent",
                        color: active ? s.color : "var(--text-secondary)",
                      }}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-(--text-primary)">
              <input
                type="checkbox"
                checked={form.isTrauma}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isTrauma: e.target.checked }))
                }
                className="h-4 w-4 accent-(--brand-navy)"
              />
              เป็นเคส Trauma (อุบัติเหตุ)
            </label>

            <Field label="จุดเกิดเหตุ / ตำบล">
              <input
                type="text"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
                className="input"
              />
            </Field>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="ชื่อย่อผู้ป่วย">
                <input
                  type="text"
                  value={form.patientInitials}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientInitials: e.target.value }))
                  }
                  className="input"
                />
              </Field>
              <Field label="HN">
                <input
                  type="text"
                  value={form.patientHn}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientHn: e.target.value }))
                  }
                  className="input"
                />
              </Field>
              <Field label="อายุ (ปี)">
                <input
                  type="number"
                  min={0}
                  max={130}
                  value={form.patientAge}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, patientAge: e.target.value }))
                  }
                  className="input"
                />
              </Field>
            </div>

            <Field label="ผลการรักษาขั้นสุดท้าย">
              <select
                value={form.outcome}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    outcome: e.target.value as EmsCase["outcome"],
                  }))
                }
                className="input"
              >
                {OUTCOMES.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
          </>
        )}

        <Field label="หมายเหตุ">
          <textarea
            rows={2}
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="input resize-none"
          />
        </Field>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-(--brand-navy) px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "กำลังบันทึก..." : "บันทึกเคส"}
          </button>
          {justSaved && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-(--status-good)">
              <CheckCircle2 size={16} /> บันทึกแล้ว
            </span>
          )}
        </div>
      </form>

      {loading && (
        <p className="mt-6 text-xs text-(--text-muted)">กำลังโหลดข้อมูล...</p>
      )}

      {!loading && recent.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 text-sm font-bold text-(--text-primary)">
            เคสที่บันทึกล่าสุด ({recent.length})
          </h3>
          <div className="overflow-x-auto rounded-xl border border-(--border-hairline) bg-(--surface-1) shadow-sm">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-(--border-hairline) text-(--text-muted)">
                  <th className="px-3 py-2 font-medium">วันที่</th>
                  <th className="px-3 py-2 font-medium">เวร</th>
                  <th className="px-3 py-2 font-medium">ช่องทาง</th>
                  <th className="px-3 py-2 font-medium">ระดับ</th>
                  <th className="px-3 py-2 font-medium">ผลการรักษา</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {recent.slice(0, 10).map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-(--border-hairline) last:border-0"
                  >
                    <td className="px-3 py-2 tabular-nums text-(--text-primary)">
                      {c.incidentDate}
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary)">
                      {labelFor(SHIFTS, c.shift)}
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary)">
                      {labelFor(CHANNELS, c.channel)}
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary)">
                      {c.noIncident ? "ไม่พบเหตุ" : labelFor(SEVERITIES, c.severity)}
                    </td>
                    <td className="px-3 py-2 text-(--text-secondary)">
                      {labelFor(OUTCOMES, c.outcome || "")}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(c.id)}
                        className="text-(--text-muted) transition-colors hover:text-(--status-critical)"
                        title="ลบรายการนี้"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-(--text-secondary)">
        {label} {required && <span className="text-(--status-critical)">*</span>}
      </span>
      {children}
    </label>
  );
}

function PillGroup<V extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: V; label: string }[];
  value: V;
  onChange: (v: V) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-(--brand-navy) bg-(--brand-navy) text-white"
                : "border-(--border-hairline) text-(--text-secondary) hover:bg-(--page-bg)"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
