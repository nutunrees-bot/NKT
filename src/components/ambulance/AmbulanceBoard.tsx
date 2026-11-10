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
}: {
  ambulances: Ambulance[];
  checkItems: CheckItem[];
  recentChecks: AmbulanceCheck[];
  today: string;
  currentShift: string;
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
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-4">
      <div>
        <Box title="รถพยาบาล · สถานะ">
          <Fleet
            ambulances={ambulances}
            openCarId={openCarId}
            onToggleCheck={(id) => (openCarId === id ? setOpenCarId(null) : openCheck(id))}
            renderCheck={(car) => (
              <div className="mt-3 rounded-xl border border-(--line) bg-white p-3">
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
        </Box>
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

        <ItemManager checkItems={checkItems} categories={VEHICLE_CATEGORIES} />
      </div>
    </div>
  );
}

function Fleet({
  ambulances,
  openCarId,
  onToggleCheck,
  renderCheck,
}: {
  ambulances: Ambulance[];
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
            <li
              key={a.id}
              id={`car-${a.id}`}
              className="scroll-mt-20 rounded-xl border-l-4 bg-(--page-bg) p-3"
              style={{ borderLeftColor: color }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[17px] font-bold">🚑 {a.plate}</span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`เอารถ ${a.plate} ออกจากรายการ? (ประวัติการเช็คยังอยู่)`))
                      return;
                    call(() => removeAmbulance(a.id));
                  }}
                  className="text-[12px] text-(--danger) disabled:opacity-50"
                >
                  เอาออก
                </button>
              </div>

              {/* สถานะ (เลื่อนเลือก) | ปุ่มเช็คของ */}
              <div className="mt-2 flex gap-2">
                <label className="min-w-0 flex-1">
                  <span className="sr-only">สถานะรถ {a.plate}</span>
                  <select
                    value={a.status}
                    disabled={pending}
                    onChange={(e) => {
                      const next = e.target.value;
                      call(() => setAmbulanceStatus(a.id, next));
                    }}
                    className="w-full rounded-lg border-2 px-2.5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-60"
                    style={{ background: color, borderColor: color }}
                  >
                    {AMBULANCE_STATUSES.map((s) => (
                      <option key={s.value} value={s.value} className="bg-white text-(--ink)">
                        {s.value}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => onToggleCheck(a.id)}
                  aria-expanded={open}
                  className={`shrink-0 rounded-lg border-2 border-(--accent) px-3.5 text-[14px] font-semibold ${
                    open ? "bg-(--accent) text-white" : "bg-white text-(--accent)"
                  }`}
                >
                  📋 เช็คของ {open ? "▲" : "▼"}
                </button>
              </div>
              <div className="mt-1.5 text-[11.5px] text-(--muted)">
                สถานะอัปเดต {thaiDateTime(a.statusUpdatedAt)}
                {a.statusUpdatedBy ? ` โดย ${a.statusUpdatedBy}` : ""}
              </div>

              {open && renderCheck(a)}
            </li>
          );
        })}
      </ul>

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
    </>
  );
}
