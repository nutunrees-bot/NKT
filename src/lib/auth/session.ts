import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase/admin";

const COOKIE = "nkt_session";
const DAYS = 30;

/** เก็บเฉพาะ hash ของ token ในตาราง — หลุด DB ไปก็สวมสิทธิ์ไม่ได้ */
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type Role = "staff" | "driver";

export type Session = {
  accountId: string;
  code: string;
  /** ชื่อที่เจ้าหน้าที่ตั้งเองในหน้าโปรไฟล์ — ยังไม่ตั้ง = null */
  displayName: string | null;
  /** staff = ทุกหน้า · driver = พขร. เข้าได้เฉพาะหน้า Ambulance */
  role: Role;
};

export async function createSession(accountId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);

  await db()
    .from("sessions")
    .insert({
      account_id: accountId,
      token_hash: hash(token),
      expires_at: expires.toISOString(),
    });

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  type Row = {
    account_id: string;
    expires_at: string;
    revoked_at: string | null;
    accounts: unknown;
  };
  const sessions = () => db().from("sessions");
  let { data, error } = (await sessions()
    .select(
      "account_id, expires_at, revoked_at, accounts (code, is_active, display_name, role)",
    )
    .eq("token_hash", hash(token))
    .maybeSingle()) as { data: Row | null; error: unknown };
  // ยังไม่ได้รัน 0005_driver_accounts.sql = ยังไม่มีคอลัมน์ role → ทุกคนเป็น staff เหมือนเดิม
  // (กันไม่ให้ทุกคนหลุดจากระบบ ถ้า deploy โค้ดก่อนรัน SQL)
  if (error)
    ({ data, error } = (await sessions()
      .select("account_id, expires_at, revoked_at, accounts (code, is_active, display_name)")
      .eq("token_hash", hash(token))
      .maybeSingle()) as { data: Row | null; error: unknown });

  if (error || !data || data.revoked_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  // supabase-js พิมพ์ relation แบบ join เป็น array เมื่อไม่มี type ที่ generate ไว้
  const account = (
    Array.isArray(data.accounts) ? data.accounts[0] : data.accounts
  ) as
    | {
        code: string;
        is_active: boolean;
        display_name: string | null;
        role?: string;
      }
    | undefined;
  if (!account?.is_active) return null;

  return {
    accountId: data.account_id,
    code: account.code,
    displayName: account.display_name,
    role: account.role === "driver" ? "driver" : "staff",
  };
}

/**
 * เฉพาะเจ้าหน้าที่ ER — พขร. ได้ null เหมือนไม่ได้เข้าระบบ
 * ใช้กับ server action / API ที่แตะข้อมูลผู้ป่วยหรือการตั้งค่า
 */
export async function getStaffSession(): Promise<Session | null> {
  const session = await getSession();
  return session?.role === "staff" ? session : null;
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;

  if (token) {
    await db()
      .from("sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", hash(token));
  }
  jar.delete(COOKIE);
}
