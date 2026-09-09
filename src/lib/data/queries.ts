import { db } from "@/lib/supabase/admin";

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
export async function getLookups() {
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

export type Lookups = Awaited<ReturnType<typeof getLookups>>;
