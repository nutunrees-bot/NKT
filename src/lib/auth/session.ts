import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/supabase/admin";

const COOKIE = "nkt_session";
const DAYS = 30;

/** เก็บเฉพาะ hash ของ token ในตาราง — หลุด DB ไปก็สวมสิทธิ์ไม่ได้ */
function hash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export type Session = { accountId: string; code: string };

export async function createSession(accountId: string) {
  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + DAYS * 24 * 60 * 60 * 1000);

  await db().from("sessions").insert({
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

  const { data } = await db()
    .from("sessions")
    .select("account_id, expires_at, revoked_at, accounts (code, is_active)")
    .eq("token_hash", hash(token))
    .maybeSingle();

  if (!data || data.revoked_at) return null;
  if (new Date(data.expires_at) < new Date()) return null;

  // supabase-js พิมพ์ relation แบบ join เป็น array เมื่อไม่มี type ที่ generate ไว้
  const account = (
    Array.isArray(data.accounts) ? data.accounts[0] : data.accounts
  ) as { code: string; is_active: boolean } | undefined;
  if (!account?.is_active) return null;

  return { accountId: data.account_id, code: account.code };
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
