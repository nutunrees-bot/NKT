# การ deploy ขึ้น Vercel

## ตัวแปรสภาพแวดล้อมที่ต้องตั้ง (Production + Preview)

| ชื่อ | ค่า | หมายเหตุ |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://hkmhyhuyalfpjewiilwx.supabase.co` | เปิดเผยได้ |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key จาก Supabase | **ความลับ** ห้ามขึ้นต้นด้วย `NEXT_PUBLIC_` |

หาได้ที่ Supabase Dashboard → Project Settings → API Keys

> ไม่ต้องตั้ง `NEXT_PUBLIC_SUPABASE_ANON_KEY` — schema v2 ปิด anon สนิท
> แอปอ่าน/เขียนผ่านเซิร์ฟเวอร์ด้วย service_role อย่างเดียว
>
> `LEGACY_IMPORT_TOKEN` ตั้งเฉพาะตอนจะนำเข้าข้อมูลจากชีตเก่าอีกรอบ
> แล้วลบทิ้งทันทีที่เสร็จ (เส้นทางนั้นมี `reset=1` ที่ลบเคสทั้งหมดได้)

## ขั้นตอน (ผ่านหน้าเว็บ Vercel)

1. https://vercel.com/new → Import Git Repository
2. เลือก `nutunrees-bot/NKT`
   - ถ้าไม่เห็น repo: กด "Adjust GitHub App Permissions" แล้วให้สิทธิ์ Vercel
     เข้าถึง repo นี้ — **บัญชีเจ้าของ (`nutunrees-bot`) ต้องเป็นคนอนุมัติ**
3. Framework Preset จะขึ้น **Next.js** เอง · Root Directory = `./` · ไม่ต้องแก้คำสั่ง build
4. กาง Environment Variables แล้วใส่ 2 ตัวข้างบน
5. Deploy

## หลัง deploy

- เข้าเว็บที่ได้ แล้วล็อกอินด้วยรหัสเจ้าหน้าที่เพื่อเช็กว่าอ่านข้อมูลได้
- ทุก push เข้า `main` หลังจากนี้ Vercel จะ deploy ใหม่อัตโนมัติ

## ทำผ่าน CLI แทนก็ได้

ต้องมี token จาก https://vercel.com/account/tokens แล้ว:

```bash
npx vercel@latest link --yes --token <TOKEN>
npx vercel@latest env add NEXT_PUBLIC_SUPABASE_URL production --token <TOKEN>
npx vercel@latest env add SUPABASE_SERVICE_ROLE_KEY production --token <TOKEN>
npx vercel@latest deploy --prod --token <TOKEN>
```
