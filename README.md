# NKT Rescue

ระบบบันทึกปฏิบัติการการแพทย์ฉุกเฉิน (EMS) และการส่งต่อผู้ป่วย (REFER)
ของ ER โรงพยาบาลสมเด็จพระยุพราชนครไทย

ใช้งานจริง: https://nkt-sigma.vercel.app

## เริ่มต้น

```bash
npm install
cp .env.example .env.local   # แล้วเติมค่าจริงลงไป
npm run dev
```

เปิด http://localhost:3000 แล้วเข้าสู่ระบบด้วยรหัสเจ้าหน้าที่

> ต้องมี `SUPABASE_SERVICE_ROLE_KEY` ใน `.env.local` ก่อน ไม่งั้นจะขึ้น error ทุกหน้า

## เอกสาร

| ไฟล์ | เนื้อหา |
|---|---|
| [docs/handover.md](docs/handover.md) | **เริ่มอ่านที่นี่** — วิธีรับมอบโปรเจค ตั้งเครื่อง และงานที่ยังค้าง |
| [docs/deploy.md](docs/deploy.md) | วิธี deploy ขึ้น Vercel และตัวแปรที่ต้องตั้ง |
| [docs/legacy-app-spec.md](docs/legacy-app-spec.md) | สเปกหน้าจอของระบบ Google Apps Script เดิม |
| [docs/legacy-backend-spec.md](docs/legacy-backend-spec.md) | ผังคอลัมน์ชีตเดิม + ปัญหาที่ระบบใหม่แก้ไปแล้ว |
| [CLAUDE.md](CLAUDE.md) | กติกาการแก้โค้ดและจุดที่ผิดง่าย |

## สถาปัตยกรรม

Next.js 16 (App Router) + Supabase (Postgres + Storage) · deploy บน Vercel

เข้าสู่ระบบด้วยรหัสเจ้าหน้าที่ ตรวจรหัสผ่าน (bcrypt) ในฐานข้อมูล แล้ววาง session
cookie แบบ httpOnly · ฐานข้อมูลเปิด RLS โดยไม่มี policy ให้ `anon` เลย
ทุกการอ่าน/เขียนจึงเกิดฝั่งเซิร์ฟเวอร์เท่านั้น เบราว์เซอร์ไม่เคยถือคีย์ที่แตะข้อมูลได้

โครงฐานข้อมูลอยู่ที่ [supabase/v2/](supabase/v2/)
