import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client ฝั่งเซิร์ฟเวอร์เท่านั้น — ใช้ service_role key ซึ่ง bypass RLS
 *
 * schema v2 ตั้งใจไม่เปิด policy ให้ anon เลย ทุกการอ่าน/เขียนจึงต้องผ่านไฟล์นี้
 * ใน server component, server action หรือ route handler
 *
 * ⚠️ ห้าม import ไฟล์นี้จากไฟล์ที่มี "use client" เด็ดขาด — key จะรั่วไปที่เบราว์เซอร์
 *
 * สร้าง client ตอนเรียกใช้ครั้งแรก ไม่ใช่ตอน import — `next build` จะได้ไม่ล้ม
 * ในเครื่องที่ยังไม่มี secret (เช่น CI ที่ build อย่างเดียว)
 */
let client: SupabaseClient | undefined;

export function db(): SupabaseClient {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error(
      "ต้องตั้งค่า NEXT_PUBLIC_SUPABASE_URL และ SUPABASE_SERVICE_ROLE_KEY ใน .env.local",
    );
  }

  client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
