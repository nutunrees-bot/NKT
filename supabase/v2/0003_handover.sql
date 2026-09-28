-- ---------------------------------------------------------------------------
-- 0003 — ช่องที่ทะเบียนออกเหตุ EMS69 (กรอกมือ) มี แต่ระบบยังไม่มี
--   * รับแจ้งจาก: เพิ่ม "แจ้งที่ฐาน"
--   * สับถ่าย (ญาติ/กู้ภัย) + จุดสับถ่าย
-- เพิ่มคอลัมน์อย่างเดียว เคสเก่าไม่กระทบ (ช่องใหม่เป็น null) · รันซ้ำได้
-- ---------------------------------------------------------------------------

alter table public.ems_cases
  drop constraint if exists ems_cases_received_from_check;
alter table public.ems_cases
  add constraint ems_cases_received_from_check
  check (received_from in ('1669','ER','วิทยุ','แจ้งที่ฐาน'));

alter table public.ems_cases
  add column if not exists handover_with  text,
  add column if not exists handover_point text;

alter table public.ems_cases
  drop constraint if exists ems_cases_handover_with_check;
alter table public.ems_cases
  add constraint ems_cases_handover_with_check
  check (handover_with in ('ญาติ','กู้ภัย'));

comment on column public.ems_cases.handover_with  is 'สับถ่ายผู้ป่วยกับ ญาติ/กู้ภัย (null = ไม่ได้สับถ่าย)';
comment on column public.ems_cases.handover_point is 'จุดสับถ่าย เช่น หน้า รร.แก่งหว้า';
