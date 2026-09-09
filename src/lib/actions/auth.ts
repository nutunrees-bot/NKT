"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/supabase/admin";
import { createSession, destroySession, getSession } from "@/lib/auth/session";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!code || !password) return { error: "กรุณากรอกรหัสและรหัสผ่าน" };

  const { data: accountId, error } = await db().rpc("verify_account", {
    p_code: code,
    p_password: password,
  });

  if (error) return { error: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง" };

  if (!accountId) {
    await db().from("login_events").insert({ code, action: "failed" });
    // ไม่บอกว่าผิดที่รหัสหรือรหัสผ่าน เพื่อไม่ให้เดารหัสที่มีอยู่จริงได้
    return { error: "รหัสหรือรหัสผ่านไม่ถูกต้อง" };
  }

  await createSession(accountId as string);
  await db().from("login_events").insert({ code, action: "login" });

  redirect("/");
}

export async function logoutAction() {
  const session = await getSession();
  if (session) {
    await db().from("login_events").insert({
      code: session.code,
      action: "logout",
    });
  }
  await destroySession();
  redirect("/login");
}
