-- ---------------------------------------------------------------------------
-- 0006 — DTX เก็บเป็นข้อความ เพื่อกรอก LOW / HI ได้ (เครื่องวัดน้ำตาลขึ้นค่าเกินช่วงเป็นตัวอักษร)
-- ค่าตัวเลขเดิมแปลงเป็นข้อความตรงตัว (120 → '120') ไม่มีข้อมูลหาย · รันซ้ำได้
--
-- ลำดับ: รันไฟล์นี้ "ก่อน" deploy โค้ดใหม่ — โค้ดเดิมส่งตัวเลขมา คอลัมน์ text รับได้
-- (ถ้า deploy ก่อน คนกรอก LOW จะบันทึกไม่ผ่านจนกว่าจะรันไฟล์นี้)
-- ---------------------------------------------------------------------------

alter table public.ems_cases  alter column dtx type text using dtx::text;
alter table public.ems_vitals alter column dtx type text using dtx::text;

comment on column public.ems_cases.dtx  is 'DTX (mg%) — ตัวเลข หรือ LOW / HI';
comment on column public.ems_vitals.dtx is 'DTX (mg%) — ตัวเลข หรือ LOW / HI';
