// Placeholder data shaped like the EMS69 register (โรงพยาบาลสมเด็จพระยุพราชนครไทย).
// Swap for live Supabase queries once the EMS table is wired up.

export type MonthlyShift = {
  month: string;
  morning: number; // เวรเช้า 08:00-16:00
  afternoon: number; // เวรบ่าย 16:00-24:00
  night: number; // เวรดึก 24:00-08:00
};

export const monthlyShifts: MonthlyShift[] = [
  { month: "ต.ค.68", morning: 38, afternoon: 20, night: 12 },
  { month: "พ.ย.68", morning: 33, afternoon: 17, night: 13 },
  { month: "ธ.ค.68", morning: 52, afternoon: 25, night: 6 },
  { month: "ม.ค.69", morning: 43, afternoon: 32, night: 17 },
  { month: "ก.พ.69", morning: 33, afternoon: 19, night: 10 },
  { month: "มี.ค.69", morning: 33, afternoon: 20, night: 9 },
  { month: "เม.ย.69", morning: 32, afternoon: 19, night: 9 },
  { month: "พ.ค.69", morning: 21, afternoon: 20, night: 13 },
  { month: "มิ.ย.69", morning: 0, afternoon: 0, night: 0 },
  { month: "ก.ค.69", morning: 0, afternoon: 0, night: 0 },
  { month: "ส.ค.69", morning: 0, afternoon: 0, night: 0 },
  { month: "ก.ย.69", morning: 0, afternoon: 0, night: 0 },
];

export const channels = [
  { name: "1669", value: 320, color: "var(--series-3)" },
  { name: "เบอร์ห้องฉุกเฉิน", value: 195, color: "var(--series-1)" },
  { name: "วิทยุ", value: 4, color: "var(--series-4)" },
  { name: "อื่นๆ/แจ้งฐาน", value: 27, color: "var(--series-2)" },
];

export const traumaMatrix = [
  { label: "Emergency (แดง)", short: "แดง", value: 70, color: "var(--triage-red)" },
  { label: "Urgency (เหลือง)", short: "เหลือง", value: 90, color: "var(--triage-yellow)" },
  { label: "Non-urgent (เขียว)", short: "เขียว", value: 18, color: "var(--triage-green)" },
  { label: "Death ณ ที่เกิดเหตุ", short: "เสียชีวิต", value: 2, color: "var(--text-muted)" },
];

export const outcomes = [
  { label: "D/C (จำหน่ายกลับบ้านจากห้องฉุกเฉิน)", value: 175, pct: 32, color: "var(--status-good)" },
  { label: "Admit (รับไว้รักษาในหอผู้ป่วย)", value: 328, pct: 60, color: "var(--series-1)" },
  { label: "Refer (ส่งต่อโรงพยาบาลอื่น)", value: 33, pct: 6, color: "var(--series-4)" },
  { label: "เสียชีวิต", value: 10, pct: 2, color: "var(--status-critical)" },
];

export function totalIncidents(range: MonthlyShift[] = monthlyShifts) {
  return range.reduce((sum, m) => sum + m.morning + m.afternoon + m.night, 0);
}

export const kpis = {
  totalIncidents: totalIncidents(),
  redCases: 338,
  transferCases: 44,
  transferBreakdown: "ฉจ: 7 | กู้ภัย: 37",
  noIncidentCases: 21,
};
