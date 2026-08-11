import type { EmsCase } from "@/lib/data/ems-repository";

// Turns raw ems_cases rows into the aggregate shapes the dashboard charts
// expect (previously hand-written in mock-ems.ts).

const THAI_MONTHS = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7); // "YYYY-MM"
}

/** "2025-10" -> "ต.ค.68" (Thai month + 2-digit Buddhist-Era year). */
export function monthLabel(key: string): string {
  const [yStr, mStr] = key.split("-");
  const y = Number(yStr) + 543;
  const m = Number(mStr) - 1;
  return `${THAI_MONTHS[m] ?? mStr}${String(y).slice(-2)}`;
}

export const CATEGORY_LABELS: Record<EmsCase["category"], string> = {
  general_accident: "อุบัติเหตุทั่วไป / จราจร",
  traffic_victim_act: "ผู้ป่วย พรบ. ผู้ประสบภัยจากรถ",
  critical_illness: "ผู้ป่วยฉุกเฉินวิกฤต/โรคทั่วไป",
};

// FilterSidebar's severity filter uses "gray" for the onsite-death bucket;
// the DB calls it death_onsite.
export const SEVERITY_FILTER_KEYS: Record<string, EmsCase["severity"]> = {
  red: "red",
  yellow: "yellow",
  green: "green",
  gray: "death_onsite",
};

const CHANNEL_META: Record<
  EmsCase["channel"],
  { name: string; color: string }
> = {
  "1669": { name: "1669", color: "var(--series-3)" },
  er_phone: { name: "เบอร์ห้องฉุกเฉิน", color: "var(--series-1)" },
  radio: { name: "วิทยุ", color: "var(--series-4)" },
  other: { name: "อื่นๆ/แจ้งฐาน", color: "var(--series-2)" },
};

const SEVERITY_META: {
  key: EmsCase["severity"];
  label: string;
  short: string;
  color: string;
}[] = [
  { key: "red", label: "Emergency (แดง)", short: "แดง", color: "var(--triage-red)" },
  { key: "yellow", label: "Urgency (เหลือง)", short: "เหลือง", color: "var(--triage-yellow)" },
  { key: "green", label: "Non-urgent (เขียว)", short: "เขียว", color: "var(--triage-green)" },
  { key: "death_onsite", label: "Death ณ ที่เกิดเหตุ", short: "เสียชีวิต", color: "var(--text-muted)" },
];

const OUTCOME_META: {
  key: Exclude<EmsCase["outcome"], "">;
  label: string;
  color: string;
}[] = [
  { key: "discharge", label: "D/C (จำหน่ายกลับบ้านจากห้องฉุกเฉิน)", color: "var(--status-good)" },
  { key: "admit", label: "Admit (รับไว้รักษาในหอผู้ป่วย)", color: "var(--series-1)" },
  { key: "refer", label: "Refer (ส่งต่อโรงพยาบาลอื่น)", color: "var(--series-4)" },
  { key: "death", label: "เสียชีวิต", color: "var(--status-critical)" },
];

export type MonthlyShift = {
  month: string;
  morning: number;
  afternoon: number;
  night: number;
};

/** All distinct months present in `cases`, sorted chronologically — used to
 * drive the FilterSidebar range slider. */
export function buildMonths(cases: EmsCase[]): string[] {
  return Array.from(new Set(cases.map((c) => monthKey(c.incidentDate)))).sort();
}

export function buildMonthlyShifts(
  cases: EmsCase[],
  months: string[],
): MonthlyShift[] {
  return months.map((key) => {
    const inMonth = cases.filter((c) => monthKey(c.incidentDate) === key);
    return {
      month: monthLabel(key),
      morning: inMonth.filter((c) => c.shift === "morning").length,
      afternoon: inMonth.filter((c) => c.shift === "afternoon").length,
      night: inMonth.filter((c) => c.shift === "night").length,
    };
  });
}

export function buildChannels(cases: EmsCase[]) {
  return (Object.keys(CHANNEL_META) as EmsCase["channel"][]).map((key) => ({
    name: CHANNEL_META[key].name,
    value: cases.filter((c) => c.channel === key).length,
    color: CHANNEL_META[key].color,
  }));
}

export function buildTraumaMatrix(cases: EmsCase[]) {
  return SEVERITY_META.map((s) => ({
    label: s.label,
    short: s.short,
    value: cases.filter((c) => c.severity === s.key).length,
    color: s.color,
  }));
}

export function buildOutcomes(cases: EmsCase[]) {
  const withOutcome = cases.filter((c) => c.outcome);
  const total = withOutcome.length;
  return OUTCOME_META.map((o) => {
    const value = withOutcome.filter((c) => c.outcome === o.key).length;
    return {
      label: o.label,
      value,
      pct: total > 0 ? Math.round((value / total) * 100) : 0,
      color: o.color,
    };
  });
}

export function buildKpis(cases: EmsCase[]) {
  const totalIncidents = cases.length;
  const redCases = cases.filter(
    (c) => c.severity === "red" || c.severity === "death_onsite",
  ).length;
  const referred = cases.filter((c) => c.outcome === "refer");
  const trauma = referred.filter((c) => c.isTrauma).length;
  const nonTrauma = referred.length - trauma;
  const noIncidentCases = cases.filter((c) => c.noIncident).length;

  return {
    totalIncidents,
    redCases,
    transferCases: referred.length,
    transferBreakdown: `Trauma: ${trauma} | Non-trauma: ${nonTrauma}`,
    noIncidentCases,
  };
}
