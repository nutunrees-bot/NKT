"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Ambulance, ArrowLeftRight, HeartPulse, PlusCircle, UploadCloud, XCircle } from "lucide-react";
import FilterSidebar from "@/components/ems/FilterSidebar";
import KpiCard from "@/components/ems/KpiCard";
import ShiftStackedBarChart from "@/components/ems/ShiftStackedBarChart";
import ChannelDonutChart from "@/components/ems/ChannelDonutChart";
import TraumaMatrix from "@/components/ems/TraumaMatrix";
import OutcomeBars from "@/components/ems/OutcomeBars";
import { listEmsCases, type EmsCase } from "@/lib/data/ems-repository";
import {
  CATEGORY_LABELS,
  SEVERITY_FILTER_KEYS,
  buildChannels,
  buildKpis,
  buildMonthlyShifts,
  buildMonths,
  buildOutcomes,
  buildTraumaMatrix,
  monthKey,
} from "@/lib/dashboard/ems-aggregate";

const ALL_CATEGORIES = Object.values(CATEGORY_LABELS);
const ALL_SEVERITY = Object.keys(SEVERITY_FILTER_KEYS);

export default function EmsDashboardPage() {
  const [cases, setCases] = useState<EmsCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [fromIndex, setFromIndex] = useState(0);
  const [toIndex, setToIndex] = useState(0);
  const [activeCategories, setActiveCategories] = useState(
    new Set(ALL_CATEGORIES),
  );
  const [activeSeverity, setActiveSeverity] = useState(new Set(ALL_SEVERITY));

  useEffect(() => {
    listEmsCases()
      .then((data) => {
        setCases(data);
        const months = buildMonths(data);
        setToIndex(Math.max(0, months.length - 1));
      })
      .catch((err) => setError(err.message ?? "โหลดข้อมูลไม่สำเร็จ"))
      .finally(() => setLoading(false));
  }, []);

  const months = useMemo(() => buildMonths(cases), [cases]);

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
    setToIndex(Math.max(0, months.length - 1));
    setActiveCategories(new Set(ALL_CATEGORIES));
    setActiveSeverity(new Set(ALL_SEVERITY));
  }

  // Cases within the selected month range + active category/severity
  // filters — every chart and KPI below is computed straight from this.
  const filteredCases = useMemo(() => {
    const monthsInRange = new Set(months.slice(fromIndex, toIndex + 1));
    return cases.filter((c) => {
      if (!monthsInRange.has(monthKey(c.incidentDate))) return false;
      if (!activeCategories.has(CATEGORY_LABELS[c.category])) return false;
      const severityFilterKey = Object.entries(SEVERITY_FILTER_KEYS).find(
        ([, v]) => v === c.severity,
      )?.[0];
      if (severityFilterKey && !activeSeverity.has(severityFilterKey))
        return false;
      return true;
    });
  }, [cases, months, fromIndex, toIndex, activeCategories, activeSeverity]);

  const filteredShifts = useMemo(
    () => buildMonthlyShifts(filteredCases, months.slice(fromIndex, toIndex + 1)),
    [filteredCases, months, fromIndex, toIndex],
  );
  const channels = useMemo(() => buildChannels(filteredCases), [filteredCases]);
  const traumaMatrix = useMemo(() => buildTraumaMatrix(filteredCases), [filteredCases]);
  const outcomes = useMemo(() => buildOutcomes(filteredCases), [filteredCases]);
  const kpis = useMemo(() => buildKpis(filteredCases), [filteredCases]);

  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:py-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-(--text-primary) sm:text-xl">
            EMSNKT Command Center
          </h2>
          <p className="text-xs text-(--text-secondary)">
            ศูนย์ประมวลผลและสารสนเทศการแพทย์ฉุกเฉิน
            โรงพยาบาลสมเด็จพระยุพราชนครไทย &middot; ข้อมูลจริงจาก Supabase
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

      {error && (
        <div className="mb-4 rounded-lg border border-(--status-critical) bg-(--status-critical)/10 px-3 py-2 text-xs font-medium text-(--status-critical)">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-xs text-(--text-muted)">กำลังโหลดข้อมูล...</p>
      ) : (
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
                value={kpis.totalIncidents}
                sublabel="✓ EMS โรงพยาบาลหลัก"
                icon={Ambulance}
                accent="var(--brand-navy)"
              />
              <KpiCard
                label="ผู้ป่วยสีแดง (วิกฤตเฉียบพลัน)"
                value={kpis.redCases}
                sublabel="รวมกลุ่มเฉียบพลัน & เสียชีวิต ณ ที่เกิดเหตุ"
                icon={HeartPulse}
                accent="var(--status-critical)"
              />
              <KpiCard
                label="เคสส่งต่อ / สับเปลี่ยนผู้ป่วย"
                value={kpis.transferCases}
                sublabel={kpis.transferBreakdown}
                icon={ArrowLeftRight}
                accent="var(--series-1)"
              />
              <KpiCard
                label="ไม่พบเหตุ / ปฏิเสธการรักษา"
                value={kpis.noIncidentCases}
                sublabel="ไม่ประสงค์ รพ / ยกเลิกกิจ"
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
                    การจำแนกเวรปฏิบัติงานที่ออกเหตุรายเดือน
                    {filteredShifts.length > 0 &&
                      ` (${filteredShifts[0].month} - ${filteredShifts[filteredShifts.length - 1].month})`}
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
      )}
    </div>
  );
}
