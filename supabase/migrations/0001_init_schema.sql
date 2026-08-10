-- NKT Rescue & Refer — initial schema
-- โรงพยาบาลสมเด็จพระยุพราชนครไทย
-- 3 modules: EMS (ems_cases), Refer In/Out (refer_records), Triage Summary (triage_monthly)
--
-- Apply with the Supabase MCP `apply_migration` tool, or `supabase db push`
-- once the project exists. Written to be idempotent-ish for local dev re-runs.
--
-- NOTE: the app has no login yet, so all 3 tables grant full CRUD to the
-- `anon` role (temporary — see the commented-out `authenticated`-only
-- policies under each table). `created_by` will just stay null until auth
-- ships; swap the anon policies back out at that point.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Shared: staff profile (extends auth.users with a display name + role)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role text not null default 'staff' check (role in ('staff', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: read own or any authenticated" on public.profiles
  for select to authenticated using (true);

create policy "profiles: update own" on public.profiles
  for update to authenticated using (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 1) EMS — ทะเบียนเหตุการณ์การแพทย์ฉุกเฉิน (EMS69)
-- ---------------------------------------------------------------------------
create table if not exists public.ems_cases (
  id uuid primary key default gen_random_uuid(),

  incident_date date not null,
  incident_time time,
  shift text not null check (shift in ('morning', 'afternoon', 'night')), -- เช้า 08-16 / บ่าย 16-24 / ดึก 24-08

  channel text not null check (channel in ('1669', 'er_phone', 'radio', 'other')), -- ช่องทางแจ้งเหตุ

  category text not null check (
    category in ('general_accident', 'traffic_victim_act', 'critical_illness')
  ), -- อุบัติเหตุทั่วไป / ผู้ป่วย พรบ. / ผู้ป่วยฉุกเฉินวิกฤต-โรคทั่วไป

  severity text not null check (
    severity in ('red', 'yellow', 'green', 'death_onsite')
  ), -- คัดแยกระดับความเร่งด่วน ณ จุดเกิดเหตุ
  is_trauma boolean not null default false,

  location text, -- จุดเกิดเหตุ / ตำบล
  patient_initials text, -- ชื่อย่อผู้ป่วย (เลี่ยงเก็บชื่อเต็มใน dashboard ทั่วไป)
  patient_hn text,
  patient_age int check (patient_age is null or patient_age between 0 and 130),

  outcome text check (
    outcome is null or outcome in ('discharge', 'admit', 'refer', 'death')
  ), -- ผลการรักษาขั้นสุดท้าย D/C, Admit, Refer, Death

  no_incident boolean not null default false, -- ไม่พบเหตุ / ปฏิเสธการรักษา
  no_incident_reason text,

  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ems_cases_incident_date_idx on public.ems_cases (incident_date);
create index if not exists ems_cases_severity_idx on public.ems_cases (severity);

alter table public.ems_cases enable row level security;

-- TEMP: app has no login yet, so anon (public API key) is granted full CRUD.
-- Once auth ships, drop these 4 policies and re-enable the authenticated-only
-- ones (kept below, commented out) instead.
create policy "ems_cases: anon read" on public.ems_cases
  for select to anon, authenticated using (true);

create policy "ems_cases: anon insert" on public.ems_cases
  for insert to anon, authenticated with check (true);

create policy "ems_cases: anon update" on public.ems_cases
  for update to anon, authenticated using (true);

create policy "ems_cases: anon delete" on public.ems_cases
  for delete to anon, authenticated using (true);

-- create policy "ems_cases: authenticated read" on public.ems_cases
--   for select to authenticated using (true);
--
-- create policy "ems_cases: authenticated insert" on public.ems_cases
--   for insert to authenticated with check (true);
--
-- create policy "ems_cases: authenticated update own or admin" on public.ems_cases
--   for update to authenticated using (
--     created_by = auth.uid()
--     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );
--
-- create policy "ems_cases: admin delete" on public.ems_cases
--   for delete to authenticated using (
--     exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );

-- ---------------------------------------------------------------------------
-- 2) Refer In / Out — ทะเบียนส่งต่อผู้ป่วยระหว่างโรงพยาบาล
-- ---------------------------------------------------------------------------
create table if not exists public.refer_records (
  id uuid primary key default gen_random_uuid(),

  direction text not null check (direction in ('in', 'out')),
  refer_date date not null,

  hn text,
  patient_name text,
  patient_age int check (patient_age is null or patient_age between 0 and 130),

  diagnosis text, -- การวินิจฉัยโรค
  department text, -- สาขา
  refer_reason text, -- เหตุผลการ refer
  patient_type text, -- ประเภทผู้ป่วย

  from_hospital text not null,
  to_hospital text not null,
  transport_method text, -- การเดินทางมา

  outcome text, -- ผลการรักษา

  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists refer_records_refer_date_idx on public.refer_records (refer_date);
create index if not exists refer_records_direction_idx on public.refer_records (direction);

alter table public.refer_records enable row level security;

-- TEMP: same anon-open policy as ems_cases — see note above.
create policy "refer_records: anon read" on public.refer_records
  for select to anon, authenticated using (true);

create policy "refer_records: anon insert" on public.refer_records
  for insert to anon, authenticated with check (true);

create policy "refer_records: anon update" on public.refer_records
  for update to anon, authenticated using (true);

create policy "refer_records: anon delete" on public.refer_records
  for delete to anon, authenticated using (true);

-- create policy "refer_records: authenticated read" on public.refer_records
--   for select to authenticated using (true);
--
-- create policy "refer_records: authenticated insert" on public.refer_records
--   for insert to authenticated with check (true);
--
-- create policy "refer_records: authenticated update own or admin" on public.refer_records
--   for update to authenticated using (
--     created_by = auth.uid()
--     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );
--
-- create policy "refer_records: admin delete" on public.refer_records
--   for delete to authenticated using (
--     exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );

-- ---------------------------------------------------------------------------
-- 3) Triage Summary — สรุปความถูกต้องของการคัดกรองรายเดือน/รายสี
-- ---------------------------------------------------------------------------
create table if not exists public.triage_monthly (
  id uuid primary key default gen_random_uuid(),

  month_date date not null, -- เก็บเป็นวันที่ 1 ของเดือน เช่น 2025-10-01
  color text not null check (color in ('red', 'pink', 'yellow', 'green', 'white')),

  under_triage int not null default 0 check (under_triage >= 0),
  over_triage int not null default 0 check (over_triage >= 0),
  correct int not null default 0 check (correct >= 0),

  notes text,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (month_date, color)
);

create index if not exists triage_monthly_month_idx on public.triage_monthly (month_date);

alter table public.triage_monthly enable row level security;

-- TEMP: same anon-open policy as ems_cases — see note above.
create policy "triage_monthly: anon read" on public.triage_monthly
  for select to anon, authenticated using (true);

create policy "triage_monthly: anon insert" on public.triage_monthly
  for insert to anon, authenticated with check (true);

create policy "triage_monthly: anon update" on public.triage_monthly
  for update to anon, authenticated using (true);

create policy "triage_monthly: anon delete" on public.triage_monthly
  for delete to anon, authenticated using (true);

-- create policy "triage_monthly: authenticated read" on public.triage_monthly
--   for select to authenticated using (true);
--
-- create policy "triage_monthly: authenticated insert" on public.triage_monthly
--   for insert to authenticated with check (true);
--
-- create policy "triage_monthly: authenticated update own or admin" on public.triage_monthly
--   for update to authenticated using (
--     created_by = auth.uid()
--     or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );
--
-- create policy "triage_monthly: admin delete" on public.triage_monthly
--   for delete to authenticated using (
--     exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );

-- ---------------------------------------------------------------------------
-- updated_at auto-touch trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger ems_cases_set_updated_at
  before update on public.ems_cases
  for each row execute function public.set_updated_at();

create trigger refer_records_set_updated_at
  before update on public.refer_records
  for each row execute function public.set_updated_at();

create trigger triage_monthly_set_updated_at
  before update on public.triage_monthly
  for each row execute function public.set_updated_at();
