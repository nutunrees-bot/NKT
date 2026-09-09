-- ============================================================================
-- NKT Rescue & Refer — schema v2 (เขียนใหม่ทั้งหมด)
-- ถอดฟิลด์จากระบบ Google Apps Script ของจริง — ดู docs/legacy-app-spec.md
--
-- หลักการ:
--   * ไม่ใช้ Supabase Auth — login ด้วย "รหัสเจ้าหน้าที่" เหมือนระบบเดิม
--     ตรวจรหัสฝั่งเซิร์ฟเวอร์ (Next.js route handler + service_role key) แล้ววาง
--     session cookie ให้ · เบราว์เซอร์ไม่เคยถือ key ที่แตะข้อมูลได้
--   * ทุกตารางเปิด RLS แต่ตั้งใจไม่สร้าง policy ให้ anon/authenticated เลย =
--     client ยิงตรงเข้ามาอ่านไม่ได้แม้รู้ anon key (ต่างจาก v1 ที่เปิดให้ anon หมด)
--   * ไฟล์แนบ (ลายเซ็น/รูปถ่าย) เก็บใน Storage bucket ส่วนตัว เก็บแค่ path ในตาราง
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- เจ้าหน้าที่ + การเข้าระบบ
-- ---------------------------------------------------------------------------
create table public.staff (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,            -- รหัสที่ใช้ login (พิมพ์ใหญ่)
  password_hash text not null,                   -- bcrypt ห้ามเก็บรหัสดิบ
  full_name     text not null,
  -- rn = พยาบาล, aemt = เวชกิจฉุกเฉิน, assistant = ผู้ช่วย PN/NA, driver = พขร.
  roles         text[] not null default '{}',
  is_admin      boolean not null default false,
  is_active     boolean not null default true,
  sort_order    int not null default 0,
  created_at    timestamptz not null default now()
);
create index staff_active_idx on public.staff (is_active, sort_order);

comment on column public.staff.roles is
  'ใช้กรองรายชื่อในฟอร์ม: ผู้ให้บริการ 1/2 = rn+aemt, ผู้ช่วย = assistant, พขร. = driver, ผู้ประเมิน = rn เท่านั้น';

create table public.sessions (
  id         uuid primary key default gen_random_uuid(),
  staff_id   uuid not null references public.staff (id) on delete cascade,
  token_hash text not null unique,               -- เก็บ hash ของ token ไม่เก็บตัว token
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index sessions_staff_idx on public.sessions (staff_id);

-- ---------------------------------------------------------------------------
-- ตารางอ้างอิง (ของเดิม hard-code ในโค้ด — ย้ายมาให้แก้ได้โดยไม่ต้อง deploy)
-- ---------------------------------------------------------------------------
create table public.hospitals (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.subdistricts (          -- ตำบลในเขตรับผิดชอบ + "นอกเขต"
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- EMS — ทะเบียนปฏิบัติการฉุกเฉิน
-- ---------------------------------------------------------------------------
create table public.ems_cases (
  id uuid primary key default gen_random_uuid(),

  -- ข้อมูลทั่วไป -------------------------------------------------------------
  incident_date date not null,
  seq_no        int  not null,                   -- "เหตุที่ N" ของวันนั้น ระบบออกให้
  op_no         text,                            -- เลขปฏิบัติการ
  shift         text check (shift in ('เช้า','บ่าย','ดึก')),
  staff_provider1 text,                          -- เก็บเป็นชื่อ เพราะฟอร์มพิมพ์เองได้
  staff_provider2 text,
  staff_helper    text,
  staff_driver    text,

  -- เหตุการณ์ ---------------------------------------------------------------
  received_from text check (received_from in ('1669','ER','วิทยุ')),
  incident_type text check (incident_type in ('พรบ','อุบัติเหตุ','ฉุกเฉิน')),
  incident_detail text,
  location      text,
  caller_phone  text,
  severity      text check (severity in ('สีแดง','สีเหลือง','สีเขียว','สีขาว','สีดำ')),
  trauma_type   text check (trauma_type in ('Trauma','Non-Trauma')),
  scene_status  text check (scene_status in ('พบเหตุ','ไม่พบเหตุ','ไม่ประสงค์ รพ.')),

  -- เวลาปฏิบัติการ ----------------------------------------------------------
  t_received        time,
  t_dispatch        time,
  t_depart_station  time,
  t_arrive_scene    time,
  t_depart_scene    time,
  t_arrive_hospital time,
  t_arrive_station  time,
  -- คำนวณให้เลย เผื่อข้ามเที่ยงคืน (+1440 แล้ว mod) เหมือนสูตรในแอปเดิม
  response_time_min int generated always as (
    case when t_received is null or t_arrive_scene is null then null
    else ((extract(epoch from (t_arrive_scene - t_received))/60)::int + 1440) % 1440 end
  ) stored,
  hospital_time_min int generated always as (
    case when t_depart_scene is null or t_arrive_hospital is null then null
    else ((extract(epoch from (t_arrive_hospital - t_depart_scene))/60)::int + 1440) % 1440 end
  ) stored,

  -- เลขไมล์ -----------------------------------------------------------------
  mile_out      numeric(10,1),
  mile_scene    numeric(10,1),
  mile_hospital numeric(10,1),
  mile_station  numeric(10,1),
  total_km      numeric(10,1) generated always as (mile_station - mile_out) stored,

  -- ผู้ป่วย -----------------------------------------------------------------
  patient_name        text,
  patient_age         int,
  patient_national_id text,
  patient_hn          text,
  address_subdistrict text,
  nationality         text check (nationality in ('คนไทย','แรงงานต่างด้าว','ชาวต่างชาติ')),
  nationality_detail  text,
  insurance_right     text check (insurance_right in
    ('บัตรทอง','ข้าราชการ','ประกันสังคม','แรงงานต่างด้าวขึ้นทะเบียน','ไม่มีหลักประกัน')),
  dx                  text,

  -- Vital signs ชุดแรก (ชุดประเมินซ้ำอยู่ตาราง ems_vitals) ---------------------
  bp        text,
  pr        int,
  rr        int,
  bt        numeric(4,1),
  o2sat     int,
  gcs_e     int check (gcs_e between 1 and 4),
  gcs_v     int check (gcs_v between 1 and 5),
  gcs_m     int check (gcs_m between 1 and 6),
  gcs_total int generated always as (
    coalesce(gcs_e,0) + coalesce(gcs_v,0) + coalesce(gcs_m,0)
  ) stored,
  pupil_l   text,
  pupil_r   text,
  dtx       int,
  treatment text,

  -- Trauma (เลือกได้หลายค่า) -------------------------------------------------
  wound  text[] not null default '{}',
  deform text[] not null default '{}',
  bleed  text[] not null default '{}',
  organ  text[] not null default '{}',

  -- Non-Trauma (เลือกได้หลายค่า + ช่อง Other) ---------------------------------
  medical        text[] not null default '{}',
  medical_other  text,
  obgyn          text[] not null default '{}',
  obgyn_other    text,
  peds           text[] not null default '{}',
  peds_other     text,
  surgical       text[] not null default '{}',
  surgical_other text,
  other_nt       text[] not null default '{}',

  -- การช่วยเหลือ ------------------------------------------------------------
  airway      text[] not null default '{}',
  wound_care  text[] not null default '{}',
  fluid       text[] not null default '{}',
  fluid_other text,
  splint      text[] not null default '{}',
  cpr         text[] not null default '{}',
  initial_care_result text check (initial_care_result in
    ('ไม่ยอมให้รักษา','ทุเลา','คงเดิม/คงที่','ทรุดหนัก',
     'เสียชีวิต ณ จุดเกิดเหตุ','เสียชีวิตขณะนำส่ง')),

  -- ลายเซ็น/รูปยืนยัน (เก็บ path ใน Storage bucket 'ems-attachments') ----------
  death_signature_path      text,
  death_signer_name         text,
  death_photo_path          text,
  palliative_care           boolean not null default false,
  palliative_signature_path text,
  palliative_signer_name    text,

  -- สรุปรายงาน + ผลการรักษา --------------------------------------------------
  report_summarizer text,
  evaluator_name    text,                        -- เฉพาะ RN
  outcome           text check (outcome in ('D/C','Admit','Refer','Death')),
  refer_hospital    text,                        -- กรอกเมื่อ outcome = 'Refer'

  created_by uuid references public.staff (id),
  updated_by uuid references public.staff (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint ems_cases_seq_per_day unique (incident_date, seq_no)
);
create index ems_cases_date_idx     on public.ems_cases (incident_date desc);
create index ems_cases_severity_idx on public.ems_cases (severity);
create index ems_cases_hn_idx       on public.ems_cases (patient_hn);
create index ems_cases_op_no_idx    on public.ems_cases (op_no);

-- ชุด Vital Signs ประเมินซ้ำ (แอปเดิมยัดเป็น JSON ช่องเดียว — แยกตารางให้ query ได้)
create table public.ems_vitals (
  id         uuid primary key default gen_random_uuid(),
  case_id    uuid not null references public.ems_cases (id) on delete cascade,
  sort_order int  not null default 0,
  measured_at time,
  bp    text,
  pr    int,
  rr    int,
  bt    numeric(4,1),
  o2sat int,
  gcs_e int,
  gcs_v int,
  gcs_m int,
  gcs_total int generated always as (
    coalesce(gcs_e,0) + coalesce(gcs_v,0) + coalesce(gcs_m,0)
  ) stored,
  pupil_l text,
  pupil_r text,
  dtx     int
);
create index ems_vitals_case_idx on public.ems_vitals (case_id, sort_order);

-- ---------------------------------------------------------------------------
-- REFER — ทะเบียนส่งต่อ
-- ---------------------------------------------------------------------------
create table public.refer_cases (
  id           uuid primary key default gen_random_uuid(),
  refer_date   date not null,
  patient_name text,
  patient_hn   text,
  patient_age  int,
  dx           text,
  refer_hospital text,
  trauma_type  text check (trauma_type in ('Trauma','Non-Trauma')),
  team         text check (team in ('แพทย์+พยาบาล','พยาบาล+ผู้ช่วย','พยาบาล')),
  severity     text check (severity in (
    'ระดับวิกฤต (ฉุกเฉินสีแดง)',
    'ระดับฉุกเฉิน (ฉุกเฉินสีเหลือง)',
    'ระดับเร่งด่วน (ฉุกเฉินสีเขียว)',
    'ระดับไม่เร่งด่วน (ปกติ)')),
  created_by uuid references public.staff (id),
  updated_by uuid references public.staff (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index refer_cases_date_idx on public.refer_cases (refer_date desc);
create index refer_cases_hn_idx   on public.refer_cases (patient_hn);

-- ---------------------------------------------------------------------------
-- ออกเลข "เหตุที่ N" ของวัน — เรียกตอนบันทึกเคสใหม่เท่านั้น (แก้เคสเดิมไม่แตะ)
-- ---------------------------------------------------------------------------
create or replace function public.next_ems_seq(p_date date)
returns int
language sql
as 'select coalesce(max(seq_no), 0) + 1 from public.ems_cases where incident_date = p_date';

-- ---------------------------------------------------------------------------
-- updated_at ให้ขยับเองทุกครั้งที่แก้
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as '
begin new.updated_at = now(); return new; end;
';

create trigger ems_cases_touch   before update on public.ems_cases
  for each row execute function public.touch_updated_at();
create trigger refer_cases_touch before update on public.refer_cases
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- RLS: เปิดทุกตาราง และตั้งใจไม่สร้าง policy → anon/authenticated เข้าไม่ได้เลย
-- แอปเข้าถึงผ่าน service_role ฝั่งเซิร์ฟเวอร์เท่านั้น (bypass RLS)
-- ---------------------------------------------------------------------------
alter table public.staff        enable row level security;
alter table public.sessions     enable row level security;
alter table public.hospitals    enable row level security;
alter table public.subdistricts enable row level security;
alter table public.ems_cases    enable row level security;
alter table public.ems_vitals   enable row level security;
alter table public.refer_cases  enable row level security;

revoke all on all tables in schema public from anon, authenticated;
