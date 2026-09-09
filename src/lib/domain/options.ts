/**
 * ตัวเลือกทั้งหมดในฟอร์ม — ยกมาจากแอป GAS เดิมแบบคำต่อคำ
 * (ดู docs/legacy-app-spec.md) ค่าที่เก็บลง DB ต้องตรงกับ check constraint
 * ใน supabase/v2/0001_init.sql เป๊ะๆ
 */

export const SHIFTS = ["เช้า", "บ่าย", "ดึก"] as const;
export const RECEIVED_FROM = ["1669", "ER", "วิทยุ"] as const;
export const INCIDENT_TYPES = ["พรบ", "อุบัติเหตุ", "ฉุกเฉิน"] as const;
export const SCENE_STATUSES = ["พบเหตุ", "ไม่พบเหตุ", "ไม่ประสงค์ รพ."] as const;
export const TRAUMA_TYPES = ["Trauma", "Non-Trauma"] as const;

export const SEVERITIES = [
  { value: "สีแดง", className: "bg-(--sev-red) text-white" },
  { value: "สีเหลือง", className: "bg-(--sev-yellow) text-[#5c4400]" },
  { value: "สีเขียว", className: "bg-(--sev-green) text-white" },
  { value: "สีขาว", className: "bg-white text-[#333] border-2 border-[#ccc]" },
  { value: "สีดำ", className: "bg-(--sev-black) text-white" },
] as const;

export const NATIONALITIES = ["คนไทย", "แรงงานต่างด้าว", "ชาวต่างชาติ"] as const;

export const INSURANCE_RIGHTS = [
  "บัตรทอง",
  "ข้าราชการ",
  "ประกันสังคม",
  "แรงงานต่างด้าวขึ้นทะเบียน",
  "ไม่มีหลักประกัน",
] as const;

export const INITIAL_CARE_RESULTS = [
  "ไม่ยอมให้รักษา",
  "ทุเลา",
  "คงเดิม/คงที่",
  "ทรุดหนัก",
  "เสียชีวิต ณ จุดเกิดเหตุ",
  "เสียชีวิตขณะนำส่ง",
] as const;

export const DEATH_AT_SCENE = "เสียชีวิต ณ จุดเกิดเหตุ";

export const OUTCOMES = ["D/C", "Admit", "Refer", "Death"] as const;

/** กลุ่มติ๊กได้หลายค่า — key ตรงกับชื่อคอลัมน์ใน ems_cases */
export const MULTI_GROUPS = {
  wound: {
    label: "บาดแผล",
    section: "trauma",
    options: [
      "No",
      "Cut/Laceration",
      "Abrasion",
      "Contusion",
      "Burn",
      "Stab Wound",
      "Amputate",
      "GSW",
    ],
  },
  deform: {
    label: "กระดูกผิดรูป",
    section: "trauma",
    options: ["No", "Closed", "Opened", "Dislocate"],
  },
  bleed: {
    label: "การเสียเลือด",
    section: "trauma",
    options: ["No", "Ext/Stopped", "Ext/Active", "Int. Hemorrhage"],
  },
  organ: {
    label: "อวัยวะที่บาดเจ็บ",
    section: "trauma",
    options: [
      "Head/neck",
      "Face",
      "Spine/back",
      "Chest/Clavicle",
      "Abdomen",
      "Pelvis",
      "Extremities",
      "External body surface",
      "Multiple injury",
    ],
  },
  medical: {
    label: "อายุรกรรม",
    section: "non-trauma",
    otherField: "medical_other",
    options: [
      "Dyspnea",
      "High Fever",
      "Alteration of conscious",
      "Seizure",
      "Chest pain",
      "Poisoning",
      "Digestive",
      "Other",
    ],
  },
  obgyn: {
    label: "สูติ-นรีเวช",
    section: "non-trauma",
    otherField: "obgyn_other",
    options: [
      "Labour pain/child birth",
      "Bleeding per Vagina",
      "High risk preg",
      "Rape",
      "Other",
    ],
  },
  peds: {
    label: "กุมารเวชกรรม",
    section: "non-trauma",
    otherField: "peds_other",
    options: ["Convulsion", "High Fever", "Dyspnea", "Digestive", "Other"],
  },
  surgical: {
    label: "ศัลยกรรม",
    section: "non-trauma",
    otherField: "surgical_other",
    options: ["Ac. abdominal pain", "GI Bleeding", "Other"],
  },
  other_nt: {
    label: "อื่นๆ",
    section: "non-trauma",
    options: ["Eye", "ENT", "Ortho", "Psychological problem"],
  },
  airway: {
    label: "ทางเดินหายใจ/การหายใจ",
    section: "treatment",
    options: [
      "No",
      "Clear airway",
      "Suction",
      "Oral airway",
      "O2 canula/mask",
      "Ambu bag",
      "ET",
    ],
  },
  wound_care: {
    label: "บาดแผล/ห้ามเลือด",
    section: "treatment",
    options: ["No", "Pressure Dressing", "Dressing"],
  },
  fluid: {
    label: "การให้สารน้ำ",
    section: "treatment",
    otherField: "fluid_other",
    options: ["No", "NSS", "RLS", "5%DN/2", "On locked", "Others"],
  },
  splint: {
    label: "ดามกระดูก",
    section: "treatment",
    options: [
      "No",
      "เฝือกลม/ไม้ดาม/Sling",
      "Collar with Long Spinal Board",
      "เฝือกหลังและคอ (KED)",
    ],
  },
  cpr: {
    label: "การทำ CPR",
    section: "treatment",
    options: ["No", "Yes", "AED/Defib"],
  },
} as const;

export type MultiGroupKey = keyof typeof MULTI_GROUPS;

export const MULTI_KEYS = Object.keys(MULTI_GROUPS) as MultiGroupKey[];

export function groupsOf(section: "trauma" | "non-trauma" | "treatment") {
  return MULTI_KEYS.filter((k) => MULTI_GROUPS[k].section === section);
}

export const REFER_TEAMS = [
  "แพทย์+พยาบาล",
  "พยาบาล+ผู้ช่วย",
  "พยาบาล",
] as const;

export const REFER_SEVERITIES = [
  { value: "ระดับวิกฤต (ฉุกเฉินสีแดง)", className: "bg-(--sev-red) text-white" },
  {
    value: "ระดับฉุกเฉิน (ฉุกเฉินสีเหลือง)",
    className: "bg-(--sev-yellow) text-[#5c4400]",
  },
  {
    value: "ระดับเร่งด่วน (ฉุกเฉินสีเขียว)",
    className: "bg-(--sev-green) text-white",
  },
  {
    value: "ระดับไม่เร่งด่วน (ปกติ)",
    className: "bg-white text-[#333] border-2 border-[#ccc]",
  },
] as const;
