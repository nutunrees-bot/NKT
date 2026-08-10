import { addItem, listItems, removeItem } from "./local-store";

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

const STORAGE_KEY = "nkt-ems-cases";

export function listEmsCases(): EmsCase[] {
  return listItems<EmsCase>(STORAGE_KEY);
}

export function addEmsCase(input: Omit<EmsCase, "id" | "createdAt">): EmsCase {
  const record: EmsCase = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  return addItem(STORAGE_KEY, record);
}

export function removeEmsCase(id: string) {
  removeItem<EmsCase>(STORAGE_KEY, id);
}
