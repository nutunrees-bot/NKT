"use client";

import { useState, useTransition } from "react";
import { addCheckItem, removeCheckItem } from "@/lib/actions/ambulance";
import { SHIFTS } from "@/lib/domain/options";
import { thaiDate } from "@/lib/domain/datetime";
import {
  categoryOrder,
  entryKey,
  type CheckEntry,
  type CheckItem,
  type CheckSheet,
} from "@/lib/domain/ambulance";
import { inputClass } from "@/components/ui/controls";

/** ชิ้นส่วนใบเช็คที่หน้า Ambulance และหน้าอุปกรณ์ EMS ใช้ร่วมกัน */

type Result = { error?: string };

/** "2026-11-10T03:05:00Z" -> "10/11/2569 10:05" (เวลาไทย) */
export function thaiDateTime(iso: string): string {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(iso))
      .map((x) => [x.type, x.value]),
  );
  return `${p.day}/${p.month}/${Number(p.year) + 543} ${p.hour}:${p.minute}`;
}

/** เรียก server action แล้วแจ้งเตือนถ้าพลาด */
export function useAction() {
  const [pending, start] = useTransition();
  const call = (fn: () => Promise<Result>, after?: () => void) =>
    start(async () => {
      const r = await fn();
      if (r.error) alert(r.error);
      else after?.();
    });
  return { pending, call };
}

export function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-4 rounded-2xl bg-(--card) p-4 shadow-(--card-shadow)">
      <h2 className="mb-3 border-b border-(--line) pb-2 text-[15px] font-bold text-(--blue)">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function DateShiftPicker({
  date,
  shift,
  today,
  onDate,
  onShift,
}: {
  date: string;
  shift: string;
  today: string;
  onDate: (d: string) => void;
  onShift: (s: string) => void;
}) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-3">
      <label className="block">
        <span className="mb-1 block text-[13px] text-(--muted)">วันที่</span>
        <input
          type="date"
          value={date}
          max={today}
          onChange={(e) => onDate(e.target.value || today)}
          className={inputClass}
        />
      </label>
      <div>
        <span className="mb-1 block text-[13px] text-(--muted)">เวร</span>
        <div className="flex gap-1.5">
          {SHIFTS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onShift(s)}
              className={`flex-1 rounded-lg border-2 py-2 text-[13px] ${
                s === shift
                  ? "border-(--accent) bg-(--accent-soft) font-bold text-(--accent)"
                  : "border-(--line) bg-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * ใบเช็คของ: แต่ละรายการกด มี/ไม่มี · แยกหัวข้อตามใบตรวจ
 * ใช้ key จากผู้เรียก (รถ/วัน/เวร) ให้เริ่มใหม่จากใบที่บันทึกไว้เมื่อเปลี่ยนการเลือก
 */
export function CheckForm({
  date,
  shift,
  checkItems,
  existing,
  onSave,
}: {
  date: string;
  shift: string;
  checkItems: CheckItem[];
  existing?: CheckSheet;
  onSave: (items: CheckEntry[], note: string) => Promise<Result>;
}) {
  const { pending, call } = useAction();
  // รายการ = ของในใบเช็คปัจจุบัน + ของในใบเก่าที่ถูกเอาออกจากรายการไปแล้ว (ให้เห็นครบ)
  const currentKeys = new Set(checkItems.map(entryKey));
  const rows: Omit<CheckEntry, "present">[] = [
    ...checkItems.map(({ category, name, qty }) => ({ category, name, qty })),
    ...(existing?.items ?? [])
      .filter((e) => !currentKeys.has(entryKey(e)))
      .map(({ category, name, qty }) => ({ category, name, qty })),
  ];
  const groups = categoryOrder(rows.map((r) => r.category)).map((cat) => ({
    cat,
    rows: rows.filter((r) => r.category === cat),
  }));
  const keys = rows.map(entryKey);

  const [marks, setMarks] = useState<Record<string, boolean | undefined>>(() =>
    Object.fromEntries(existing?.items.map((e) => [entryKey(e), e.present]) ?? []),
  );
  const [note, setNote] = useState(existing?.note ?? "");
  const [saved, setSaved] = useState(false);

  const answered = keys.filter((k) => marks[k] !== undefined).length;
  const missing = keys.filter((k) => marks[k] === false).length;

  const mark = (key: string, present: boolean) => {
    setSaved(false);
    setMarks((m) => ({ ...m, [key]: m[key] === present ? undefined : present }));
  };
  const markAll = (ks: string[]) => {
    setSaved(false);
    setMarks((m) => ({ ...m, ...Object.fromEntries(ks.map((k) => [k, true])) }));
  };

  if (rows.length === 0)
    return (
      <p className="py-2 text-center text-[13px] text-(--muted)">
        ยังไม่มีรายการของ — เพิ่มได้ที่ &quot;แก้ไขรายการของในใบเช็ค&quot;
      </p>
    );

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12.5px] text-(--muted)">
          {existing
            ? `แก้ใบเช็คเดิม (เช็คโดย ${existing.checkedBy ?? "-"})`
            : "ใบเช็คใหม่"}{" "}
          · เช็คแล้ว {answered}/{keys.length}
          {missing > 0 && <span className="text-[#c62828]"> · ไม่มี {missing}</span>}
        </span>
        <button
          type="button"
          onClick={() => markAll(keys)}
          className="rounded-lg border border-[#a5d6a7] bg-[#e8f5e9] px-3 py-1.5 text-[12.5px] font-semibold text-[#2e7d32]"
        >
          ✓ มีครบทุกรายการ
        </button>
      </div>

      {groups.map((g) => {
        const gKeys = g.rows.map(entryKey);
        const gDone = gKeys.filter((k) => marks[k] !== undefined).length;
        return (
          <details key={g.cat} open className="mb-3 rounded-xl border border-(--line)">
            <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-t-xl bg-(--accent-soft) px-3 py-2">
              <span className="text-[13.5px] font-bold text-(--accent-dark)">
                {g.cat || "อื่นๆ"}{" "}
                <span className="font-medium text-(--muted)">
                  ({gDone}/{gKeys.length})
                </span>
              </span>
              {groups.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault(); // ไม่ให้พับหัวข้อตอนกด
                    markAll(gKeys);
                  }}
                  className="shrink-0 rounded-md border border-[#a5d6a7] bg-white px-2 py-1 text-[11.5px] font-semibold text-[#2e7d32]"
                >
                  ✓ มีครบใบนี้
                </button>
              )}
            </summary>
            <ul className="divide-y divide-(--line)">
              {g.rows.map((r) => {
                const key = entryKey(r);
                return (
                  <li key={key} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 text-[13.5px]">
                      {r.name}
                      {r.qty && (
                        <span className="ml-1.5 text-[12px] text-(--muted)">· {r.qty}</span>
                      )}
                    </span>
                    {(
                      [
                        [true, "มี", "#2e7d32"],
                        [false, "ไม่มี", "#c62828"],
                      ] as const
                    ).map(([value, label, color]) => {
                      const on = marks[key] === value;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => mark(key, value)}
                          className="w-14 shrink-0 rounded-lg border-2 py-1.5 text-[12.5px] font-semibold"
                          style={
                            on
                              ? { background: color, borderColor: color, color: "#fff" }
                              : { background: "#fff", borderColor: "var(--line)", color }
                          }
                        >
                          {label}
                        </button>
                      );
                    })}
                  </li>
                );
              })}
            </ul>
          </details>
        );
      })}

      <label className="mb-3 block">
        <span className="mb-1 block text-[13px] text-(--muted)">หมายเหตุ</span>
        <textarea
          value={note}
          onChange={(e) => {
            setSaved(false);
            setNote(e.target.value);
          }}
          rows={2}
          placeholder="เช่น ออกซิเจนเหลือน้อย แจ้งเติมแล้ว"
          className={inputClass}
        />
      </label>

      <button
        type="button"
        disabled={pending}
        onClick={() => {
          const left = keys.length - answered;
          if (
            left > 0 &&
            !confirm(
              `ยังไม่ได้เช็ค ${left} รายการ — รายการที่ไม่ได้กดจะบันทึกเป็น "ไม่มี" ต่อไหม?`,
            )
          )
            return;
          call(
            () =>
              onSave(
                rows.map((r) => ({ ...r, present: marks[entryKey(r)] === true })),
                note,
              ),
            () => setSaved(true),
          );
        }}
        className="w-full rounded-xl bg-linear-to-r from-(--navy) to-(--hivis-dark) px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {pending
          ? "กำลังบันทึก..."
          : saved
            ? "✓ บันทึกแล้ว"
            : `บันทึกการเช็ค · ${thaiDate(date)} เวร${shift}`}
      </button>
    </div>
  );
}

/** ประวัติใบเช็ค — กดแถวเพื่อเปิดใบนั้นมาแก้ */
export function CheckHistory<T extends CheckSheet>({
  checks,
  label,
  canOpen = () => true,
  onOpen,
}: {
  checks: T[];
  /** ข้อความต่อท้ายวัน/เวร เช่น ทะเบียนรถ */
  label?: (c: T) => string;
  canOpen?: (c: T) => boolean;
  onOpen: (c: T) => void;
}) {
  if (checks.length === 0)
    return <p className="py-2 text-center text-[13px] text-(--muted)">ยังไม่มีการเช็ค</p>;

  return (
    <ul className="flex flex-col gap-2">
      {checks.map((c) => {
        const missing = c.items.filter((i) => !i.present);
        return (
          <li key={c.id}>
            <button
              type="button"
              disabled={!canOpen(c)}
              onClick={() => onOpen(c)}
              className="w-full rounded-xl border border-(--line) px-3 py-2.5 text-left active:bg-(--page-bg) disabled:cursor-default"
            >
              <div className="flex flex-wrap items-center justify-between gap-x-3 text-[13.5px] font-semibold">
                <span>
                  {thaiDate(c.date)} · เวร{c.shift}
                  {label ? ` · ${label(c)}` : ""}
                </span>
                <span
                  className="text-[12.5px]"
                  style={{ color: missing.length ? "#c62828" : "#2e7d32" }}
                >
                  {missing.length
                    ? `ขาด ${missing.length} รายการ`
                    : `ครบ ${c.items.length} รายการ`}
                </span>
              </div>
              {missing.length > 0 && (
                <div className="mt-1 text-[12px] text-[#c62828]">
                  ไม่มี: {missing.map((m) => m.name).join(", ")}
                </div>
              )}
              <div className="mt-1 text-[11.5px] text-(--muted)">
                เช็คโดย {c.checkedBy ?? "-"} · {thaiDateTime(c.updatedAt)}
                {c.note ? ` · ${c.note}` : ""}
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** เพิ่ม/เอาออกรายการของ — จำกัดหมวดที่หน้านั้นดูแล */
export function ItemManager({
  checkItems,
  categories,
}: {
  checkItems: CheckItem[];
  categories: readonly string[];
}) {
  const { pending, call } = useAction();
  const cats = categoryOrder([...categories, ...checkItems.map((i) => i.category)]);
  const [category, setCategory] = useState<string>(cats[0]);
  const [name, setName] = useState("");
  const [qty, setQty] = useState("");

  return (
    <details className="mb-4 rounded-2xl bg-(--card) p-4 shadow-(--card-shadow)">
      <summary className="cursor-pointer text-[14px] font-semibold text-(--blue)">
        แก้ไขรายการของในใบเช็ค ({checkItems.length} รายการ)
      </summary>
      {cats.map((cat) => {
        const items = checkItems.filter((i) => i.category === cat);
        if (items.length === 0) return null;
        return (
          <div key={cat} className="mt-3">
            <h3 className="text-[13px] font-bold text-(--accent-dark)">
              {cat} ({items.length})
            </h3>
            <ul className="divide-y divide-(--line)">
              {items.map((i) => (
                <li
                  key={i.id}
                  className="flex items-center justify-between gap-2 py-1.5 text-[13.5px]"
                >
                  <span>
                    {i.name}
                    {i.qty && <span className="ml-1.5 text-(--muted)">· {i.qty}</span>}
                  </span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`เอา "${i.name}" ออกจากใบเช็ค? (ใบเช็คเก่ายังเห็นอยู่)`))
                        return;
                      call(() => removeCheckItem(i.id));
                    }}
                    className="shrink-0 text-[12px] text-(--danger) disabled:opacity-50"
                  >
                    เอาออก
                  </button>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
      <form
        className="mt-4 rounded-xl bg-(--page-bg) p-3"
        onSubmit={(e) => {
          e.preventDefault();
          call(
            () => addCheckItem({ category, name, qty }),
            () => {
              setName("");
              setQty("");
            },
          );
        }}
      >
        <div className="mb-2 text-[13px] font-semibold">เพิ่มรายการ</div>
        {cats.length > 1 && (
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`${inputClass} mb-2`}
          >
            {cats.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        )}
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อของ / ยา"
            className={inputClass}
          />
          <input
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            placeholder="จำนวน (ถ้ามี)"
            className={`${inputClass} w-32! shrink-0`}
          />
        </div>
        <button
          type="submit"
          disabled={pending || !name.trim()}
          className="mt-2 w-full rounded-lg bg-(--accent) py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          เพิ่ม
        </button>
      </form>
    </details>
  );
}
