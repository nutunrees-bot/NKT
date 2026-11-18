"use client";

import { useState } from "react";
import {
  addAmbulance,
  removeAmbulance,
  saveAmbulanceCheck,
  setAmbulanceStatus,
} from "@/lib/actions/ambulance";
import { AMBULANCE_STATUSES } from "@/lib/domain/options";
import {
  VEHICLE_CATEGORIES,
  type Ambulance,
  type AmbulanceCheck,
  type CheckItem,
} from "@/lib/domain/ambulance";
import { inputClass } from "@/components/ui/controls";
import {
  Box,
  CheckForm,
  CheckHistory,
  DateShiftPicker,
  ItemManager,
  thaiDateTime,
  useAction,
} from "@/components/ambulance/CheckParts";

function statusColor(status: string): string {
  return AMBULANCE_STATUSES.find((s) => s.value === status)?.color ?? "#6b7280";
}

/** Ambulance — รถ + สถานะ (เลื่อนเลือก) + ปุ่มเช็คของที่กางใบเช็คของรถคันนั้น */
export default function AmbulanceBoard({
  ambulances,
  checkItems,
  recentChecks,
  today,
  currentShift,
  canManage,
}: {
  ambulances: Ambulance[];
  checkItems: CheckItem[];
  recentChecks: AmbulanceCheck[];
  today: string;
  currentShift: string;
  /** เจ้าหน้าที่ = true · พขร. = false (ซ่อนเพิ่ม/เอารถออก และแก้รายการของ) */
  canManage: boolean;
}) {
  // รถที่กางใบเช็คของอยู่ (ทีละคัน) + วัน/เวรของใบเช็ค
  const [openCarId, setOpenCarId] = useState<string | null>(null);
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState(currentShift);
  const plateOf = (id: string) =>
    ambulances.find((a) => a.id === id)?.plate ?? "(รถที่เอาออกแล้ว)";

  const openCheck = (carId: string, d = today, s = currentShift) => {
    setOpenCarId(carId);
    setDate(d);
    setShift(s);
    // เลื่อนจอไปที่ใบเช็คของรถคันนั้น (สำคัญบนมือถือ)
    requestAnimationFrame(() =>
      document
        .getElementById(`car-${carId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <div>
      <div>
        <h2 className="mb-2 text-[13px] font-semibold text-(--muted)">
          รถพยาบาล · สถานะ
        </h2>
        <div className="mb-4">
          <Fleet
            ambulances={ambulances}
            canManage={canManage}
            openCarId={openCarId}
            onToggleCheck={(id) => (openCarId === id ? setOpenCarId(null) : openCheck(id))}
            renderCheck={(car) => (
              <div className="border-t border-(--line) bg-white p-3">
                <h3 className="mb-2 text-[14px] font-bold text-(--blue)">
                  เช็คของภายในรถ (รายวัน แยกเวร)
                </h3>
                <DateShiftPicker
                  date={date}
                  shift={shift}
                  today={today}
                  onDate={setDate}
                  onShift={setShift}
                />
                {/* key เปลี่ยนเมื่อเลือกรถ/วัน/เวรใหม่ → ฟอร์มเริ่มใหม่จากใบเช็คที่มีอยู่ (ถ้ามี) */}
                <CheckForm
                  key={`${car.id}|${date}|${shift}`}
                  date={date}
                  shift={shift}
                  checkItems={checkItems}
                  existing={recentChecks.find(
                    (c) => c.ambulanceId === car.id && c.date === date && c.shift === shift,
                  )}
                  onSave={(items, note) =>
                    saveAmbulanceCheck({ ambulanceId: car.id, date, shift, items, note })
                  }
                />
              </div>
            )}
          />
        </div>
      </div>

      <div>
        <Box title="ประวัติการเช็คของในรถ (30 วันล่าสุด)">
          <CheckHistory
            checks={recentChecks}
            label={(c) => plateOf(c.ambulanceId)}
            canOpen={(c) => ambulances.some((a) => a.id === c.ambulanceId)}
            onOpen={(c) => openCheck(c.ambulanceId, c.date, c.shift)}
          />
        </Box>

        {canManage && (
          <ItemManager checkItems={checkItems} categories={VEHICLE_CATEGORIES} />
        )}
      </div>
    </div>
  );
}

function Fleet({
  ambulances,
  canManage,
  openCarId,
  onToggleCheck,
  renderCheck,
}: {
  ambulances: Ambulance[];
  canManage: boolean;
  openCarId: string | null;
  onToggleCheck: (id: string) => void;
  renderCheck: (car: Ambulance) => React.ReactNode;
}) {
  const { pending, call } = useAction();
  const [plate, setPlate] = useState("");

  return (
    <>
      {ambulances.length === 0 && (
        <p className="mb-3 text-center text-[13px] text-(--muted)">ยังไม่มีรถในระบบ</p>
      )}
      <ul className="flex flex-col gap-3">
        {ambulances.map((a) => {
          const color = statusColor(a.status);
          const open = openCarId === a.id;
          return (
            // การ์ดแบบเดียวกับหน้าทะเบียนผู้ป่วย: ขอบซ้ายสีสถานะ + แถวปุ่มท้ายการ์ด
            <li
              key={a.id}
              id={`car-${a.id}`}
              className="scroll-mt-20 overflow-hidden rounded-2xl border-l-[5px] bg-(--card) shadow-(--card-shadow)"
              style={{ borderLeftColor: color }}
            >
              <div className="flex gap-3 px-4 pt-3.5 pb-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15.5px] font-bold text-(--ink)">
                    🚑 {a.plate}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-(--muted)">
                    อัปเดต {thaiDateTime(a.statusUpdatedAt)}
                    {a.statusUpdatedBy ? ` · ${a.statusUpdatedBy}` : ""}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-semibold text-white"
                      style={{ background: color }}
                    >
                      {a.status}
                    </span>
                  </div>
                </div>
                {canManage && (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      if (!confirm(`เอารถ ${a.plate} ออกจากรายการ? (ประวัติการเช็คยังอยู่)`))
                        return;
                      call(() => removeAmbulance(a.id));
                    }}
                    className="self-start rounded-md px-1.5 py-0.5 text-[11.5px] text-(--muted) hover:text-(--danger) disabled:opacity-50"
                  >
                    เอาออก
                  </button>
                )}
              </div>

              {/* แถวปุ่มท้ายการ์ด: เปลี่ยนสถานะ (เลื่อนเลือก) | เช็คของ */}
              <div className="flex divide-x divide-(--line) border-t border-(--line) text-(--ink)">
                <label className="flex flex-1 items-center justify-center gap-1.5 py-1 active:bg-(--page-bg)">
                  <span className="sr-only">สถานะรถ {a.plate}</span>
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ background: color }}
                    aria-hidden
                  />
                  <select
                    value={a.status}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.value;
                      call(() => setAmbulanceStatus(a.id, next));
                    }}
                    className="min-w-0 bg-transparent py-1.5 text-[13px] font-semibold disabled:opacity-60"
                  >
                    {AMBULANCE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.value}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => onToggleCheck(a.id)}
                  aria-expanded={open}
                  className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold ${
                    open ? "bg-(--accent) text-white" : "text-(--accent) active:bg-(--page-bg)"
                  }`}
                >
                  📋 เช็คของ {open ? "▲" : "▼"}
                </button>
              </div>

              {open && renderCheck(a)}
            </li>
          );
        })}
      </ul>

      {canManage && (
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          call(() => addAmbulance(plate), () => setPlate(""));
        }}
      >
        <input
          value={plate}
          onChange={(e) => setPlate(e.target.value)}
          placeholder="เลขทะเบียนรถ เช่น กข 1234 พิษณุโลก"
          className={inputClass}
        />
        <button
          type="submit"
          disabled={pending || !plate.trim()}
          className="shrink-0 rounded-lg bg-(--accent) px-4 text-[14px] font-semibold text-white disabled:opacity-50"
        >
          เพิ่มรถ
        </button>
      </form>
      )}
    </>
  );
}
