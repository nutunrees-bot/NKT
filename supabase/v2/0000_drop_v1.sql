-- ============================================================================
-- ⚠️ ลบ schema v1 ทิ้งทั้งหมด — ข้อมูลใน 4 ตารางนี้หายถาวร กู้คืนไม่ได้
--
-- v1 คือของที่เดาฟิลด์เอาเอง ไม่ตรงกับระบบจริงที่ ER ใช้ (ผู้ใช้ยืนยันแล้วว่า
-- เป็นข้อมูลทดสอบ ทิ้งได้ — 2026-09-09)
--
-- รันไฟล์นี้ก่อน แล้วค่อยรัน 0001_init.sql → 0002_seed.sql ตามลำดับ
-- ============================================================================

drop table if exists public.ems_cases      cascade;
drop table if exists public.refer_records  cascade;
drop table if exists public.triage_monthly cascade;
drop table if exists public.profiles       cascade;
