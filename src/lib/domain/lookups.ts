export type Option = { value: string; label: string };

/** รายการที่ดึงจากตารางอ้างอิงมาเติมดรอปดาวน์ในฟอร์ม */
export type Lookups = {
  /** ผู้ให้บริการ 1/2 และผู้สรุปรายงาน — RN + AEMT */
  providers: Option[];
  /** ชื่อผู้ประเมิน — RN เท่านั้น */
  rn: Option[];
  assistants: Option[];
  drivers: Option[];
  hospitals: string[];
  subdistricts: string[];
};
