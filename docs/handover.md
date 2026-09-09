# คู่มือรับมอบโปรเจค NKT Rescue

ระบบบันทึกปฏิบัติการฉุกเฉิน (EMS) และการส่งต่อผู้ป่วย (REFER) ของ ER
โรงพยาบาลสมเด็จพระยุพราชนครไทย — เขียนใหม่จากระบบ Google Apps Script เดิม

- ใช้งานจริงที่: https://nkt-sigma.vercel.app
- โค้ด: https://github.com/nutunrees-bot/NKT
- ฐานข้อมูล: Supabase โปรเจค `hkmhyhuyalfpjewiilwx`

---

## ⚠️ 3 อย่างที่ไม่ได้อยู่ใน git — ต้องส่งมอบแยก

| สิ่งที่ต้องได้รับ | เอาไปทำอะไร |
|---|---|
| **service_role key ของ Supabase** | ใส่ใน `.env.local` ไม่งั้นรันแล้วขึ้น error ทุกหน้า |
| **สิทธิ์เข้า Supabase** (โปรเจค `hkmhyhuyalfpjewiilwx`) | ดู/แก้ข้อมูล เพิ่มบัญชีเจ้าหน้าที่ |
| **สิทธิ์เข้า Vercel** (โปรเจคที่ deploy อยู่) | ดู log, ตั้ง environment variable, rollback |

คีย์พวกนี้ **ห้าม commit ลง git เด็ดขาด** — `.gitignore` กันไว้ให้แล้ว

---

## ขั้นตอนเปิดโปรเจคในเครื่อง

### 1. ลงโปรแกรมที่ต้องใช้
- **Node.js 20 ขึ้นไป** (แนะนำ LTS) — https://nodejs.org
- **Git** — https://git-scm.com
- **VS Code** — https://code.visualstudio.com

### 2. โคลนโค้ด

```bash
git clone https://github.com/nutunrees-bot/NKT.git
cd NKT
code .
```

(หรือใน VS Code: `Ctrl+Shift+P` → พิมพ์ `Git: Clone` → วาง URL)

### 3. ลง dependency

เปิด Terminal ใน VS Code (`` Ctrl+` ``) แล้ว:

```bash
npm install
```

### 4. สร้างไฟล์ `.env.local`

คัดลอกจาก `.env.example` แล้วเติมค่าจริง — ไฟล์นี้อยู่ในเครื่องเท่านั้น ไม่ขึ้น git

```
NEXT_PUBLIC_SUPABASE_URL=https://hkmhyhuyalfpjewiilwx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<คีย์ service_role จาก Supabase>
```

หาคีย์ได้ที่ Supabase Dashboard → Project Settings → API Keys → `service_role`

### 5. รัน

```bash
npm run dev
```

เปิด http://localhost:3000 → เข้าสู่ระบบด้วยรหัสเจ้าหน้าที่ (เช่น `ERNKT001`)

> ⚠️ เครื่องที่รัน dev อยู่ **ต่อกับฐานข้อมูลตัวจริง** — ที่แก้/ลบในเครื่องคือของจริง

---

## ต่อ Claude Code เข้ากับโปรเจค

1. ติดตั้งส่วนขยาย **Claude Code** ใน VS Code (ค้นใน Extensions หรือดูที่ https://claude.com/claude-code)
2. เปิดโฟลเดอร์โปรเจคนี้ แล้วล็อกอินด้วยบัญชี Claude
3. เริ่มสั่งงานได้เลย เช่น "อธิบายโครงสร้างโปรเจคนี้ให้หน่อย"

ในโปรเจคมีไฟล์ที่ Claude อ่านเป็นบริบทอัตโนมัติอยู่แล้ว:
- `CLAUDE.md` — ภาพรวมระบบ กติกา และจุดที่ต้องระวัง
- `AGENTS.md` — ข้อควรรู้เรื่อง Next.js เวอร์ชันนี้

---

## แผนที่โปรเจค

```
src/app/
  login/                หน้าเข้าสู่ระบบ
  (app)/                หน้าที่ต้องล็อกอิน (มีแถบหัว)
    page.tsx            หน้าแรก + รายการเคส
    ems/new, ems/[id]   ฟอร์ม EMS (เพิ่ม / แก้ไข)
    refer/new, [id]     ฟอร์ม REFER
    summary/            สรุปรายเดือน
  (print)/print/        หน้าสำหรับพิมพ์ (ALS, ใบส่งต่อ) — ไม่มีแถบหัว
  api/import-legacy/    นำเข้าข้อมูลจากชีตเก่า (ปิดอยู่ ดูหัวข้อล่าง)

src/lib/
  domain/               ตัวเลือกในฟอร์ม + กฎการคำนวณ (แก้ตัวเลือกที่นี่)
  data/                 คำสั่งอ่านฐานข้อมูล
  actions/              คำสั่งเขียนฐานข้อมูล (server action)
  auth/session.ts       ระบบ session
  supabase/admin.ts     ตัวเชื่อมฐานข้อมูล (ฝั่งเซิร์ฟเวอร์เท่านั้น)

supabase/v2/            สคริปต์ SQL ที่ใช้สร้างฐานข้อมูล (รันไปแล้ว)
docs/                   เอกสารทั้งหมด
```

## เอกสารที่ควรอ่านก่อนแก้โค้ด

| ไฟล์ | เนื้อหา |
|---|---|
| `docs/legacy-app-spec.md` | ทุกฟิลด์/ทุกตัวเลือกของระบบเดิม ถอดจากหน้าเว็บ GAS |
| `docs/legacy-backend-spec.md` | ผังคอลัมน์ชีต 80 ช่อง + ปัญหาของระบบเดิม 8 ข้อ |
| `docs/deploy.md` | วิธี deploy และตัวแปรที่ต้องตั้งบน Vercel |
| `supabase/v2/0001_init.sql` | โครงฐานข้อมูลทั้งหมด พร้อมคำอธิบายทุกตาราง |

---

## งานที่ยังค้าง (ควรทำต่อ)

1. **เปลี่ยนรหัสผ่านเจ้าหน้าที่** — ตอนนี้รหัสผ่าน = รหัสผู้ใช้ (`ERNKT001`/`ERNKT001`)
   ทั้ง 16 บัญชี เดาได้ง่ายมาก เปลี่ยนได้ด้วย SQL:

   ```sql
   update public.accounts
      set password_hash = crypt('<รหัสใหม่>', gen_salt('bf'))
    where code = 'ERNKT001';
   ```

2. **ปิดการแชร์ Google Sheet เดิม** เป็น "จำกัด" — ตอนนี้ใครมีลิงก์เปิดดู
   ชื่อ/เลขบัตรประชาชน/HN ผู้ป่วยได้ทั้งหมด (ข้อมูลย้ายมาที่ระบบใหม่หมดแล้ว)

3. **ยังไม่มีระบบ REFER In** — ระบบเดิมก็ไม่มี บันทึกได้เฉพาะขาส่งออก

## ถ้าต้องนำเข้าข้อมูลจากชีตเก่าอีกรอบ

เช่นตอนสวิตช์ระบบจริงแล้วมีเคสที่บันทึกในระบบเก่าช่วงคาบเกี่ยว:

1. ตั้ง `LEGACY_IMPORT_TOKEN=<ค่าที่เดายาก>` ใน `.env.local`
2. ตั้งค่าแชร์ชีตเป็น "ทุกคนที่มีลิงก์ ดูได้" ชั่วคราว
3. เปิด (ต้องล็อกอินในแอปก่อน):
   ```
   /api/import-legacy?token=<TOKEN>&sheet_id=<ID ของชีต>&tabs=EMS_2026-09&dry=1
   ```
   `dry=1` = ดูผลก่อนโดยยังไม่เขียนจริง · เอาออกเมื่อพร้อมเขียน
   `reset=1` = **ลบเคสทั้งหมดก่อนนำเข้าใหม่** (ระวัง)
4. เสร็จแล้ว **ลบ `LEGACY_IMPORT_TOKEN` ทิ้ง** และปิดการแชร์ชีตกลับเป็น "จำกัด"
