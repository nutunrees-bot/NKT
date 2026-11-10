-- ---------------------------------------------------------------------------
-- 0005 — บัญชี พขร. (พนักงานขับรถ) เข้าได้เฉพาะหน้า Ambulance
--   * accounts.role: 'staff' (เดิมทุกบัญชี) | 'driver'
--   * บัญชีกลาง DRNKT123456 ใช้ร่วมกันทุกคน (ประวัติจะขึ้นว่า "พขร." ไม่รู้ว่าคนไหน)
-- เพิ่มคอลัมน์ + เพิ่มบัญชีอย่างเดียว บัญชี ERNKT เดิมไม่กระทบ · รันซ้ำได้
--
-- ⚠️ ต้อง deploy โค้ดที่รู้จัก role ก่อนรันไฟล์นี้ ไม่งั้นบัญชี พขร. เข้าได้ทุกหน้า
-- รหัสผ่านตั้งต้น = รหัสเข้าระบบ (แบบเดียวกับ ERNKT) เปลี่ยนได้ด้วย:
--      update public.accounts
--         set password_hash = crypt('<รหัสใหม่>', gen_salt('bf'))
--       where code = 'DRNKT123456';
-- ---------------------------------------------------------------------------

alter table public.accounts
  add column if not exists role text not null default 'staff';
alter table public.accounts
  drop constraint if exists accounts_role_check;
alter table public.accounts
  add constraint accounts_role_check check (role in ('staff','driver'));

comment on column public.accounts.role is
  'staff = เข้าได้ทุกหน้า · driver = พขร. เข้าได้เฉพาะหน้า Ambulance (เปลี่ยนสถานะรถ/เช็คของในรถ)';

insert into public.accounts (code, password_hash, display_name, role)
values ('DRNKT123456', crypt('DRNKT123456', gen_salt('bf')), 'พขร.', 'driver')
on conflict (code) do nothing;
