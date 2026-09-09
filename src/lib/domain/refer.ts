export type ReferFormValues = {
  refer_date: string;
  patient_name: string;
  patient_hn: string;
  patient_age: string;
  dx: string;
  refer_hospital: string;
  trauma_type: string;
  team: string;
  severity: string;
};

export function emptyReferForm(date: string): ReferFormValues {
  return {
    refer_date: date,
    patient_name: "",
    patient_hn: "",
    patient_age: "",
    dx: "",
    refer_hospital: "",
    trauma_type: "",
    team: "",
    severity: "",
  };
}

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function referRowToFormValues(row: Row): ReferFormValues {
  return {
    refer_date: s(row.refer_date),
    patient_name: s(row.patient_name),
    patient_hn: s(row.patient_hn),
    patient_age: s(row.patient_age),
    dx: s(row.dx),
    refer_hospital: s(row.refer_hospital),
    trauma_type: s(row.trauma_type),
    team: s(row.team),
    severity: s(row.severity),
  };
}
