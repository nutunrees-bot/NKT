"use client";

import { useState } from "react";
import { saveEquipmentCheck } from "@/lib/actions/ambulance";
import {
  EQUIPMENT_CATEGORY,
  type CheckItem,
  type CheckSheet,
} from "@/lib/domain/ambulance";
import {
  Box,
  CheckForm,
  CheckHistory,
  DateShiftPicker,
  ItemManager,
} from "@/components/ambulance/CheckParts";

/** อุปกรณ์ EMS — ใบตรวจรายวันแยกเวร (ไม่ผูกกับรถ) */
export default function EquipmentBoard({
  checkItems,
  recentChecks,
  today,
  currentShift,
}: {
  checkItems: CheckItem[];
  recentChecks: CheckSheet[];
  today: string;
  currentShift: string;
}) {
  const [date, setDate] = useState(today);
  const [shift, setShift] = useState(currentShift);

  return (
    <div className="lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-4">
      <div id="equipment-form" className="scroll-mt-20">
        <Box title="เช็คอุปกรณ์ EMS (รายวัน แยกเวร)">
          <DateShiftPicker
            date={date}
            shift={shift}
            today={today}
            onDate={setDate}
            onShift={setShift}
          />
          {/* key เปลี่ยนเมื่อเลือกวัน/เวรใหม่ → ฟอร์มเริ่มใหม่จากใบที่บันทึกไว้ (ถ้ามี) */}
          <CheckForm
            key={`${date}|${shift}`}
            date={date}
            shift={shift}
            checkItems={checkItems}
            existing={recentChecks.find((c) => c.date === date && c.shift === shift)}
            onSave={(items, note) => saveEquipmentCheck({ date, shift, items, note })}
          />
        </Box>
      </div>

      <div>
        <Box title="ประวัติการเช็คอุปกรณ์ EMS (30 วันล่าสุด)">
          <CheckHistory
            checks={recentChecks}
            onOpen={(c) => {
              setDate(c.date);
              setShift(c.shift);
              requestAnimationFrame(() =>
                document
                  .getElementById("equipment-form")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" }),
              );
            }}
          />
        </Box>

        <ItemManager checkItems={checkItems} categories={[EQUIPMENT_CATEGORY]} />
      </div>
    </div>
  );
}
