-- ---------------------------------------------------------------------------
-- 0004 — รถพยาบาล (Ambulance)
--   * ambulances            ทะเบียนรถ + สถานะปัจจุบัน (เลือกได้ทีละอย่าง)
--   * ambulance_check_items รายการของประจำรถ แยกตามใบตรวจ (แก้/เพิ่ม/ซ่อนได้จากหน้าแอป)
--   * ambulance_checks      ผลเช็คของรายวัน แยกเวร · 1 คัน/วัน/เวร = 1 ใบ (แก้ทับได้)
--   * ems_equipment_checks  ใบตรวจอุปกรณ์ EMS รายวัน แยกเวร (ไม่ผูกกับรถ)
-- สร้างตารางใหม่อย่างเดียว ไม่แตะตารางเดิม · รันซ้ำได้
-- ⚠️ อย่ารัน run-all.sql ซ้ำ — ไฟล์นั้นลบตารางทั้งหมดแล้วสร้างใหม่
-- ---------------------------------------------------------------------------

create table if not exists public.ambulances (
  id                uuid primary key default gen_random_uuid(),
  plate             text not null unique,            -- เลขทะเบียนรถ
  status            text not null default 'พร้อมใช้งาน'
                    check (status in ('พร้อมใช้งาน','ซ่อม','ไปราชการ','ไป Refer')),
  status_updated_at timestamptz not null default now(),
  status_updated_by uuid references public.accounts (id),
  is_active         boolean not null default true,   -- เลิกใช้รถ = ซ่อน ไม่ลบ ประวัติเช็คยังอยู่
  created_at        timestamptz not null default now()
);

create table if not exists public.ambulance_check_items (
  id         uuid primary key default gen_random_uuid(),
  category   text not null,                          -- ใบตรวจที่รายการนี้อยู่ (หัวข้อในหน้าเช็ค)
  name       text not null,
  qty        text,                                   -- จำนวนที่ต้องมี เช่น "3 amp" (กล่องยา)
  sort_order int  not null default 0,
  is_active  boolean not null default true,          -- เอาออกจากใบเช็ค = ซ่อน ไม่ลบ
  created_at timestamptz not null default now(),
  -- ชื่อซ้ำข้ามใบได้ (เช่น "ไม้ดามแขน,ขา" อยู่ทั้งใบอุปกรณ์ EMS และใบประจำรถ)
  constraint ambulance_check_items_unique unique (category, name)
);

create table if not exists public.ambulance_checks (
  id           uuid primary key default gen_random_uuid(),
  ambulance_id uuid not null references public.ambulances (id) on delete cascade,
  check_date   date not null,
  shift        text not null check (shift in ('เช้า','บ่าย','ดึก')),
  -- เก็บของ ณ ตอนเช็คไว้เลย [{ "category": "...", "name": "AED", "qty": null, "present": true }]
  -- แก้รายการของทีหลัง ใบเช็คเก่าไม่เพี้ยน
  items        jsonb not null default '[]'::jsonb,
  note         text,
  checked_by   uuid references public.accounts (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint ambulance_checks_one_per_shift unique (ambulance_id, check_date, shift)
);
create index if not exists ambulance_checks_date_idx
  on public.ambulance_checks (check_date desc);

drop trigger if exists ambulance_checks_touch on public.ambulance_checks;
create trigger ambulance_checks_touch before update on public.ambulance_checks
  for each row execute function public.touch_updated_at();

-- ใบตรวจอุปกรณ์ EMS (หมวด 'อุปกรณ์ EMS') — ไม่ผูกกับรถ · 1 วัน/เวร = 1 ใบ
create table if not exists public.ems_equipment_checks (
  id         uuid primary key default gen_random_uuid(),
  check_date date not null,
  shift      text not null check (shift in ('เช้า','บ่าย','ดึก')),
  items      jsonb not null default '[]'::jsonb,
  note       text,
  checked_by uuid references public.accounts (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ems_equipment_checks_one_per_shift unique (check_date, shift)
);

drop trigger if exists ems_equipment_checks_touch on public.ems_equipment_checks;
create trigger ems_equipment_checks_touch before update on public.ems_equipment_checks
  for each row execute function public.touch_updated_at();

-- RLS เปิด ไม่มี policy เหมือนตารางอื่น — แอปเข้าผ่าน service_role ฝั่งเซิร์ฟเวอร์เท่านั้น
alter table public.ambulances            enable row level security;
alter table public.ambulance_check_items enable row level security;
alter table public.ambulance_checks      enable row level security;
alter table public.ems_equipment_checks  enable row level security;
revoke all on public.ambulances, public.ambulance_check_items, public.ambulance_checks,
  public.ems_equipment_checks
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- รายการของ — ถอดจากใบตรวจกระดาษของ ER (ต.ค. 2569) ตามลำดับในใบ
-- ---------------------------------------------------------------------------
insert into public.ambulance_check_items (category, name, qty, sort_order) values
  -- แบบตรวจสอบรายการอุปกรณ์และเวชภัณฑ์ประจำรถพยาบาล
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'สาย suction (8,14,16,18)', null, 101),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'หูฟัง', null, 102),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Ambu bag เด็กเล็ก, เด็กโต, ผู้ใหญ่', null, 103),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Cannula, Mask with bag เด็ก, ผู้ใหญ่', null, 104),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Nebulizer เด็ก, ผู้ใหญ่', null, 105),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Oral airway (S,M,L)', null, 106),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'เกจ์ออกซิเจน', null, 107),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Long spinal board (พร้อมอุปกรณ์), เปลตัก', null, 108),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Hard collar (S,M,L, ปรับได้)', null, 109),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ไฟฉาย, ถ่านไฟฉาย', null, 110),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ไม้ดามแขน, ขา', null, 111),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ถุงมือ Disposable (S,M,L), mask', null, 112),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ถุงมือ sterile (6.5, 7, 7.5)', null, 113),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', '0.9% NSS 1000 ml, RLS, 5%D/N/2, Dextran', null, 114),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Syringe 3, 5, 10, 20, 50', null, 115),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Needle (18, 21, 24)', null, 116),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Medicut (18, 20, 22, 24) / tourniquet', null, 117),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Set IV เด็ก, ผู้ใหญ่, Three-way, Extension tube', null, 118),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Gauze, Top gauze, scrub gauze', null, 119),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ไม้พันสำลี, ผ้ากันเปื้อน', null, 120),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Roll gauze, Gauze bandage (2, 4, 6)', null, 121),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'NSS for suction, sterile for O2', null, 122),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ถุงยาง, กระดาษทิชชู', null, 123),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'KED ประจำรถ, เฝือกลม (vacuum splint)', null, 124),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'ถังดับเพลิง', null, 125),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Stretcher, stair chair', null, 126),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Light, Silent light, เช็คยางรถ', null, 127),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'AED', null, 128),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'BP monitor', null, 129),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'O2 Sat', null, 130),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'เครื่อง Suction', null, 131),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'Ventilator', null, 132),
  ('อุปกรณ์และเวชภัณฑ์ประจำรถ', 'BP ติดผนัง', null, 133),

  -- แบบตรวจสอบอุปกรณ์ EMS
  ('อุปกรณ์ EMS', 'Long spinal board', null, 201),
  ('อุปกรณ์ EMS', 'แผ่นรองศีรษะ', null, 202),
  ('อุปกรณ์ EMS', 'Head immobilizer', null, 203),
  ('อุปกรณ์ EMS', 'สายรัดคาง', null, 204),
  ('อุปกรณ์ EMS', 'สายรัดตัว (belt)', null, 205),
  ('อุปกรณ์ EMS', 'เปลตัก (scoop)', null, 206),
  ('อุปกรณ์ EMS', 'Hard collar (S,M,L ปรับได้)', null, 207),
  ('อุปกรณ์ EMS', 'ไม้ดามแขน, ขา', null, 208),
  ('อุปกรณ์ EMS', 'เสื้อกันฝน / เสื้อ EMS', null, 209),
  ('อุปกรณ์ EMS', 'ไฟฉายใหญ่, ที่ชาร์จไฟฉาย', null, 210),
  ('อุปกรณ์ EMS', 'กล่องอุบัติเหตุ แดง, เหลือง, เขียว, ดำ', null, 211),
  ('อุปกรณ์ EMS', 'ธงสี แดง, เหลือง, เขียว, ดำ', null, 212),
  ('อุปกรณ์ EMS', 'กระเป๋าป้ายคัดกรองผู้ป่วย, วิทยุ, แท่นชาร์จ', null, 213),
  ('อุปกรณ์ EMS', 'KED', null, 214),
  ('อุปกรณ์ EMS', 'เฝือกลม', null, 215),
  ('อุปกรณ์ EMS', 'กระเป๋าแดง EMS', null, 216),
  ('อุปกรณ์ EMS', 'กระเป๋าปฐมพยาบาล', null, 217),
  ('อุปกรณ์ EMS', 'AED / สายต่อ', null, 218),
  ('อุปกรณ์ EMS', 'กระเป๋าใส่ tube', null, 219),

  -- แบบตรวจสอบรายการกล่องยาฉุกเฉิน (กล่องที่ 1)
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Adenosine', '3 amp', 301),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Adrenaline', '10 amp', 302),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Atropine', '5 amp', 303),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Berodual NB', '3 vial', 304),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Diazepam', '5 amp', 305),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Glucose 50 ml', '2 ขวด', 306),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'CPM', '5 amp', 307),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Dexamethasone', '5 amp', 308),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Sodium bicarbonate', '2 amp', 309),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'Salbutamol NB', '3 vial', 310),
  ('กล่องยาฉุกเฉิน (กล่องที่ 1)', 'ASA, Clopidogrel, Isordil', '2 อัน', 311)
on conflict (category, name) do nothing;
