import { supabase } from "@/lib/supabase/client";

// Mirrors public.ems_cases from supabase/migrations/0001_init_schema.sql —
// keep the two in sync when either changes.
export type EmsCase = {
  id: string;
  incidentDate: string; // yyyy-mm-dd
  incidentTime: string; // HH:mm
  shift: "morning" | "afternoon" | "night";
  channel: "1669" | "er_phone" | "radio" | "other";
  category: "general_accident" | "traffic_victim_act" | "critical_illness";
  severity: "red" | "yellow" | "green" | "death_onsite";
  isTrauma: boolean;
  location: string;
  patientInitials: string;
  patientHn: string;
  patientAge: number | null;
  outcome: "discharge" | "admit" | "refer" | "death" | "";
  noIncident: boolean;
  noIncidentReason: string;
  notes: string;
  createdAt: string;
};

// Snake_case shape as stored in public.ems_cases.
type EmsCaseRow = {
  id: string;
  incident_date: string;
  incident_time: string | null;
  shift: EmsCase["shift"];
  channel: EmsCase["channel"];
  category: EmsCase["category"];
  severity: EmsCase["severity"];
  is_trauma: boolean;
  location: string | null;
  patient_initials: string | null;
  patient_hn: string | null;
  patient_age: number | null;
  outcome: EmsCase["outcome"] | null;
  no_incident: boolean;
  no_incident_reason: string | null;
  notes: string | null;
  created_at: string;
};

function rowToCase(row: EmsCaseRow): EmsCase {
  return {
    id: row.id,
    incidentDate: row.incident_date,
    incidentTime: row.incident_time ?? "",
    shift: row.shift,
    channel: row.channel,
    category: row.category,
    severity: row.severity,
    isTrauma: row.is_trauma,
    location: row.location ?? "",
    patientInitials: row.patient_initials ?? "",
    patientHn: row.patient_hn ?? "",
    patientAge: row.patient_age,
    outcome: row.outcome ?? "",
    noIncident: row.no_incident,
    noIncidentReason: row.no_incident_reason ?? "",
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export async function listEmsCases(): Promise<EmsCase[]> {
  const { data, error } = await supabase
    .from("ems_cases")
    .select("*")
    .order("incident_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as EmsCaseRow[]).map(rowToCase);
}

export async function addEmsCase(
  input: Omit<EmsCase, "id" | "createdAt">,
): Promise<EmsCase> {
  const { data, error } = await supabase
    .from("ems_cases")
    .insert({
      incident_date: input.incidentDate,
      incident_time: input.incidentTime || null,
      shift: input.shift,
      channel: input.channel,
      category: input.category,
      severity: input.severity,
      is_trauma: input.isTrauma,
      location: input.location || null,
      patient_initials: input.patientInitials || null,
      patient_hn: input.patientHn || null,
      patient_age: input.patientAge,
      outcome: input.outcome || null,
      no_incident: input.noIncident,
      no_incident_reason: input.noIncidentReason || null,
      notes: input.notes || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return rowToCase(data as EmsCaseRow);
}

export async function removeEmsCase(id: string): Promise<void> {
  const { error } = await supabase.from("ems_cases").delete().eq("id", id);
  if (error) throw error;
}
