"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-(--line) bg-white px-2.5 py-2.5 text-(--ink) disabled:bg-[#f3f3f3]";

export function Section({
  title,
  children,
  dimmed = false,
}: {
  title: string;
  children: ReactNode;
  dimmed?: boolean;
}) {
  return (
    <fieldset
      disabled={dimmed}
      className={`mb-3.5 rounded-2xl border border-(--line) bg-(--card) p-4 ${
        dimmed ? "pointer-events-none opacity-40" : ""
      }`}
    >
      <legend className="sr-only">{title}</legend>
      <h3 className="mb-3 border-b border-(--line) pb-2 text-sm font-semibold text-(--blue)">
        {title}
      </h3>
      {children}
    </fieldset>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1 block text-[13px] text-(--muted)">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11.5px] text-(--muted)">{hint}</span>}
    </label>
  );
}

/** ติ๊กได้ค่าเดียว — กดซ้ำที่ตัวเดิมเพื่อยกเลิกได้ */
export function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(value === opt ? "" : opt)}
          className={`rounded-full border-2 px-3.5 py-2 text-[13px] ${
            value === opt
              ? "border-(--hivis-dark) bg-(--hivis-soft) font-bold text-(--hivis-dark)"
              : "border-(--line) bg-white"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function SeverityPicker({
  options,
  value,
  onChange,
  stacked = false,
}: {
  options: readonly { value: string; className: string }[];
  value: string;
  onChange: (v: string) => void;
  stacked?: boolean;
}) {
  return (
    <div className={`flex gap-2 ${stacked ? "flex-col" : "flex-wrap"}`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          className={`rounded-xl px-3.5 py-2.5 text-[13px] font-semibold ${opt.className} ${
            value === opt.value ? "outline-3 outline-offset-2 outline-[#1a73e8]" : ""
          }`}
        >
          {opt.value}
        </button>
      ))}
    </div>
  );
}

const isOtherOption = (v: string) => /^others?\b/i.test(v.trim());

/** ติ๊กได้หลายค่า · ตัวเลือก Other/Others จะเปิดช่องพิมพ์รายละเอียด */
export function MultiChipGroup({
  label,
  options,
  values,
  onChange,
  otherText,
  onOtherTextChange,
}: {
  label: string;
  options: readonly string[];
  values: string[];
  onChange: (v: string[]) => void;
  otherText?: string;
  onOtherTextChange?: (v: string) => void;
}) {
  const otherOption = options.find(isOtherOption);
  const otherActive = !!otherOption && values.includes(otherOption);

  return (
    <div className="mb-3">
      <span className="mb-1 block text-[13px] text-(--muted)">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = values.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() =>
                onChange(
                  active ? values.filter((v) => v !== opt) : [...values, opt],
                )
              }
              className={`rounded-full border-2 px-3.5 py-2 text-[13px] ${
                active
                  ? "border-(--hivis-dark) bg-(--hivis-soft) font-bold text-(--hivis-dark)"
                  : "border-(--line) bg-white"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {otherActive && onOtherTextChange && (
        <input
          value={otherText ?? ""}
          onChange={(e) => onOtherTextChange(e.target.value)}
          placeholder="ระบุรายละเอียด..."
          className="mt-1.5 w-full rounded-lg border-2 border-(--hivis-dark) px-3 py-2 text-[13px]"
        />
      )}
    </div>
  );
}

/** ดรอปดาวน์รายชื่อ + ตัวเลือก "อื่นๆ (พิมพ์เอง)" เหมือนแอปเดิม */
export function NameSelect({
  options,
  value,
  onChange,
  placeholder = "-- เลือกชื่อ --",
}: {
  options: readonly { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const known = options.some((o) => o.value === value);
  const [custom, setCustom] = useState(!known && value !== "");

  return (
    <>
      <select
        value={custom ? "__other__" : value}
        onChange={(e) => {
          if (e.target.value === "__other__") {
            setCustom(true);
            onChange("");
          } else {
            setCustom(false);
            onChange(e.target.value);
          }
        }}
        className={inputClass}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
        <option value="__other__">อื่นๆ (พิมพ์เอง)</option>
      </select>
      {custom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="พิมพ์ชื่อ"
          className={`mt-1.5 ${inputClass}`}
        />
      )}
    </>
  );
}

/** ช่องเวลา + ปุ่ม "ตอนนี้" (ใช้เวลาไทยจากเครื่องผู้ใช้ ซึ่งคือเวลาหน้างานจริง) */
export function TimeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-1.5">
        <input
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => {
            const d = new Date();
            onChange(
              `${String(d.getHours()).padStart(2, "0")}:${String(
                d.getMinutes(),
              ).padStart(2, "0")}`,
            );
          }}
          className="shrink-0 rounded-lg border border-[#c9e6a8] bg-(--hivis-soft) px-2.5 py-2.5 text-[12px] whitespace-nowrap text-(--hivis-dark)"
        >
          ตอนนี้
        </button>
      </div>
    </Field>
  );
}

export function TotalBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2.5 text-center text-sm font-bold text-[#166534]">
      {children}
    </div>
  );
}

/**
 * ให้ญาติเซ็นด้วยนิ้วบนจอ — ส่งออกเป็น data URL
 * `value` ที่เป็น http/path เดิมจะถูกวาดกลับลงผืนผ้าใบเพื่อให้เห็นของเดิมตอนแก้ไข
 */
export function SignaturePad({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef({ x: 0, y: 0 });
  const dirty = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !value || dirty.current) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    img.src = value;
  }, [value]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * canvas.width) / rect.width,
      y: ((e.clientY - rect.top) * canvas.height) / rect.height,
    };
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-[#ccc] bg-white">
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          className="block h-[180px] w-full touch-none bg-white"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drawing.current = true;
            dirty.current = true;
            last.current = point(e);
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return;
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            const p = point(e);
            ctx.lineWidth = 2.5;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#111";
            ctx.beginPath();
            ctx.moveTo(last.current.x, last.current.y);
            ctx.lineTo(p.x, p.y);
            ctx.stroke();
            last.current = p;
          }}
          onPointerUp={() => {
            drawing.current = false;
            const canvas = canvasRef.current;
            if (canvas) onChange(canvas.toDataURL("image/png"));
          }}
        />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext("2d");
            if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
            dirty.current = true;
            onChange("");
          }}
          className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-[12px]"
        >
          🧹 ล้างลายเซ็น
        </button>
        <span className="text-[12px] text-(--muted)">
          ให้ญาติเซ็นด้วยนิ้วในกรอบด้านบน
        </span>
      </div>
    </div>
  );
}
