"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Ambulance, ArrowLeftRight, HeartPulse, PlusCircle, UploadCloud, XCircle } from "lucide-react";
import FilterSidebar from "@/components/ems/FilterSidebar";
import KpiCard from "@/components/ems/KpiCard";
import ShiftStackedBarChart from "@/components/ems/ShiftStackedBarChart";
import ChannelDonutChart from "@/components/ems/ChannelDonutChart";
import TraumaMatrix from "@/components/ems/TraumaMatrix";
import OutcomeBars from "@/components/ems/OutcomeBars";
import {
  channels,
  kpis,
  monthlyShifts,
  outcomes,
  totalIncidents,
  traumaMatrix,
} from "@/lib/mock-ems";

const ALL_CATEGORIES = [
  "อุบัติเหตุทั่วไป / จราจร",
  "ผู้ป่วย พรบ. ผู้ประสบภัยจากรถ",
  "ผู้ป่วยฉุกเฉินวิกฤต/โรคทั่วไป",
];
const ALL_SEVERITY = ["red", "yellow", "green", "gray"];

export default function EmsDashboardPage() {
  const months = useMemo(() => monthlyShifts.map((m) => m.month), []);
  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(months.length - 1);
  const [activeCategories, setActiveCategories] = useState(
    new Set(ALL_CATEGORIES),
  );
  const [activeSeverity, setActiveSeverity] = useState(new Set(ALL_SEVERITY));

  const filteredShifts = useMemo(
    () => monthlyShifts.slice(fromIndex, toIndex + 1),
    [fromIndex, toIndex],
  );
  const filteredTotal = useMemo(
    () => totalIncidents(filteredShifts),
    [filteredShifts],
  );
  const scale = filteredTotal / kpis.totalIncidents || 0;

  function toggleCategory(c: string) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      next.has(c) ? next.delete(c) : next.add(c);
      return next;
    });
  }

  function toggleSeverity(s: string) {
    setActiveSeverity((prev) => {
      const next = new Set(prev);
      next.has(s) ? next.delete(s) : next.add(s);
      return next;
    });
  }

  function resetFilters() {
    setFromIndex(0);
    setToIndex(months.length - 1);
    setActiveCategories(new Set(ALL_CATEGORIES));
    setActiveSeverity(new Set(ALL_SEVERITY));
  }

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-(--text-primary) sm:text-xl">
            EMSNKT Command Center
          </h2>
          <p className="text-xs text-(--text-secondary)">
            ศูนย์ประมวลผลและสารสนเทศการแพทย์ฉุกเฉิน
            โรงพยาบาลสมเด็จพระยุพราชนครไทย &middot; ข้อมูลตัวอย่าง (mock)
            รอเชื่อมฐานข้อมูลจริง
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/ems/entry"
            className="flex items-center gap-2 rounded-lg border border-(--brand-navy) px-3.5 py-2 text-xs font-semibold text-(--brand-navy) transition-colors hover:bg-(--brand-navy)/5"
          >
            <PlusCircle size={15} />
            บันทึกเคสใหม่
          </Link>
          <button
            type="button"
            title="เร็วๆ นี้: อัปโหลด CSV จริงเพื่อแทนที่ข้อมูลตัวอย่าง"
            className="flex items-center gap-2 rounded-lg bg-(--brand-navy) px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <UploadCloud size={15} />
            อัปโหลดข้อมูล CSV จริง
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <FilterSidebar
          months={months}
          fromIndex={fromIndex}
          toIndex={toIndex}
          onFromChange={setFromIndex}
          onToChange={setToIndex}
          activeCategories={activeCategories}
          onToggleCategory={toggleCategory}
          activeSeverity={activeSeverity}
          onToggleSeverity={toggleSeverity}
          onReset={resetFilters}
        />

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="เคสรับแจ้งเหตุรวมทั้งหมด"
              value={filteredTotal}
              sublabel="✓ EMS โรงพยาบาลหลัก"
              icon={Ambulance}
              accent="var(--brand-navy)"
            />
            <KpiCard
              label="ผู้ป่วยสีแดง (วิกฤตเฉียบพลัน)"
              value={Math.round(kpis.redCases * scale)}
              sublabel="รวมกลุ่มเฉียบพลัน & Trauma"
              icon={HeartPulse}
              accent="var(--status-critical)"
            />
            <KpiCard
              label="เคสส่งต่อ / สับเปลี่ยนผู้ป่วย"
              value={Math.round(kpis.transferCases * scale)}
              sublabel={kpis.transferBreakdown}
              icon={ArrowLeftRight}
              accent="var(--series-1)"
            />
            <KpiCard
              label="ไม่พบเหตุ / ปฏิเสธการรักษา"
              value={Math.round(kpis.noIncidentCases * scale)}
              sublabel="ไม่ประสงค์ sw / ยกเลิกกิจ"
              icon={XCircle}
              accent="var(--text-muted)"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
            <div className="rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: "var(--series-1)" }}
                  />
                  การจำแนกเวรปฏิบัติงานที่ออกเหตุรายเดือน ({months[0]} -{" "}
                  {months[months.length - 1]})
                </h3>
                <span className="rounded-full bg-(--page-bg) px-2.5 py-1 text-[11px] font-medium text-(--text-secondary)">
                  เวรเช้า &middot; บ่าย &middot; ดึก
                </span>
              </div>
              <ShiftStackedBarChart data={filteredShifts} />
            </div>

            <div className="rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm">
              <h3 className="flex items-center gap-2 text-sm font-bold text-(--text-primary)">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: "var(--series-3)" }}
                />
                ช่องทางการรับแจ้งเหตุหลัก
              </h3>
              <ChannelDonutChart data={channels} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <TraumaMatrix data={traumaMatrix} />
            <OutcomeBars data={outcomes} />
          </div>
        </div>
      </div>
    </div>
  );
}
