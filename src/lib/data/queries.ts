import { db } from "@/lib/supabase/admin";
import type { Lookups } from "@/lib/domain/lookups";

type AccountRef = { code: string } | { code: string }[] | null;

export type EmsListItem = {
  id: string;
  incident_date: string;
  seq_no: number;
  patient_name: string | null;
  severity: string | null;
  outcome: string | null;
  scene_status: string | null;
  accounts: AccountRef;
};

export type ReferListItem = {
  id: string;
  refer_date: string;
  patient_name: string | null;
  patient_hn: string | null;
  severity: string | null;
  refer_hospital: string | null;
  accounts: AccountRef;
};

const EMS_LIST_COLUMNS =
  "id, incident_date, seq_no, patient_name, severity, outcome, scene_status, accounts:created_by (code)";

export async function listEmsCases(from: string, to: string) {
  const { data, error } = await db()
    .from("ems_cases")
    .select(EMS_LIST_COLUMNS)
    .gte("incident_date", from)
    .lte("incident_date", to)
    .order("incident_date", { ascending: true })
    .order("seq_no", { ascending: true });

  if (error) throw new Error(`โหลดรายการ EMS ไม่สำเร็จ: ${error.message}`);
  return (data ?? []) as unknown as EmsListItem[];
}

export async function listReferCases(from: string, to: string) {
  const { data, error } = await db()
    .from("refer_cases")
    .select(
      "id, refer_date, patient_name, patient_hn, severity, refer_hospital, accounts:created_by (code)",
    )
    .gte("refer_date", from)
    .lte("refer_date", to)
    .order("refer_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`โหลดรายการ REFER ไม่สำเร็จ: ${error.message}`);
  return (data ?? []) as unknown as ReferListItem[];
}

export async function getEmsCase(id: string) {
  const { data, error } = await db()
    .from("ems_cases")
    .select("*, ems_vitals (*)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`โหลดเคสไม่สำเร็จ: ${error.message}`);
  return data;
}

export async function getReferCase(id: string) {
  const { data, error } = await db()
    .from("refer_cases")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`โหลดเคสไม่สำเร็จ: ${error.message}`);
  return data;
}

/** รายชื่อ/รพ./ตำบล ที่แอปเดิม hard-code ไว้ ตอนนี้อยู่ใน DB แก้ได้โดยไม่ต้อง deploy */
export async function getLookups(): Promise<Lookups> {
  const [staff, hospitals, subdistricts] = await Promise.all([
    db()
      .from("staff")
      .select("full_name, roles")
      .eq("is_active", true)
      .order("sort_order"),
    db()
      .from("hospitals")
      .select("name")
      .eq("is_active", true)
      .order("sort_order"),
    db()
      .from("subdistricts")
      .select("name")
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const all = (staff.data ?? []) as { full_name: string; roles: string[] }[];
  const byRole = (role: string) =>
    all.filter((s) => s.roles.includes(role)).map((s) => s.full_name);

  const rn = byRole("rn");
  const aemt = byRole("aemt");

  return {
    /** ผู้ให้บริการ 1/2 และผู้สรุปรายงาน เลือกได้ทั้ง RN และ AEMT */
    providers: [
      ...rn.map((n) => ({ value: n, label: `${n} (RN)` })),
      ...aemt.map((n) => ({ value: n, label: `${n} (AEMT)` })),
    ],
    /** ชื่อผู้ประเมิน เลือกได้เฉพาะ RN */
    rn: rn.map((n) => ({ value: n, label: n })),
    assistants: byRole("assistant").map((n) => ({ value: n, label: n })),
    drivers: byRole("driver").map((n) => ({ value: n, label: n })),
    hospitals: (hospitals.data ?? []).map((h: { name: string }) => h.name),
    subdistricts: (subdistricts.data ?? []).map((s: { name: string }) => s.name),
  };
}


/** เลข "เหตุที่" ที่ระบบจะออกให้เคสถัดไปของวันนั้น (โชว์ให้เห็นก่อนบันทึก) */
export async function nextEmsSeq(date: string): Promise<number | null> {
  const { data, error } = await db().rpc("next_ems_seq", { p_date: date });
  if (error) return null;
  return data as number;
}

export type MonthlySummary = {
  ems: {
    total: number;
    found: number;
    notFound: number;
    trauma: number;
    nonTrauma: number;
    severity: Record<string, number>;
    bySubdistrict: Record<string, number>;
    totalKm: number;
  };
  refer: {
    total: number;
    trauma: number;
    nonTrauma: number;
    byHospital: Record<string, number>;
  };
};

/** สรุปรายเดือน — ดึงแถวของเดือนนั้นมานับในแอป (เดือนหนึ่งไม่กี่ร้อยเคส) */
export async function getMonthlySummary(ym: string): Promise<MonthlySummary> {
  const [y, m] = ym.split("-").map(Number);
  const from = `${ym}-01`;
  const to = `${ym}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;

  const [emsResult, referResult] = await Promise.all([
    db()
      .from("ems_cases")
      .select("severity, trauma_type, scene_status, address_subdistrict, total_km")
      .gte("incident_date", from)
      .lte("incident_date", to),
    db()
      .from("refer_cases")
      .select("trauma_type, refer_hospital")
      .gte("refer_date", from)
      .lte("refer_date", to),
  ]);

  const emsRows = (emsResult.data ?? []) as Record<string, unknown>[];
  const referRows = (referResult.data ?? []) as Record<string, unknown>[];

  const severity: Record<string, number> = {};
  const bySubdistrict: Record<string, number> = {};
  let found = 0;
  let notFound = 0;
  let trauma = 0;
  let nonTrauma = 0;
  let totalKm = 0;

  for (const r of emsRows) {
    if (r.scene_status === "พบเหตุ") found++;
    if (r.scene_status === "ไม่พบเหตุ") notFound++;
    if (r.trauma_type === "Trauma") trauma++;
    if (r.trauma_type === "Non-Trauma") nonTrauma++;
    if (r.severity) severity[String(r.severity)] = (severity[String(r.severity)] ?? 0) + 1;
    if (r.address_subdistrict) {
      const key = String(r.address_subdistrict);
      bySubdistrict[key] = (bySubdistrict[key] ?? 0) + 1;
    }
    const km = Number(r.total_km);
    if (!Number.isNaN(km)) totalKm += km;
  }

  const byHospital: Record<string, number> = {};
  let referTrauma = 0;
  let referNonTrauma = 0;
  for (const r of referRows) {
    if (r.trauma_type === "Trauma") referTrauma++;
    if (r.trauma_type === "Non-Trauma") referNonTrauma++;
    if (r.refer_hospital) {
      const key = String(r.refer_hospital);
      byHospital[key] = (byHospital[key] ?? 0) + 1;
    }
  }

  return {
    ems: {
      total: emsRows.length,
      found,
      notFound,
      trauma,
      nonTrauma,
      severity,
      bySubdistrict,
      totalKm: Math.round(totalKm * 10) / 10,
    },
    refer: {
      total: referRows.length,
      trauma: referTrauma,
      nonTrauma: referNonTrauma,
      byHospital,
    },
  };
}
