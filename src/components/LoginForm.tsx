"use client";

import { useActionState, useState } from "react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );
  // แอปเดิมเติมรหัสผ่านตามรหัสที่พิมพ์ให้อัตโนมัติ (รหัสผ่าน = รหัสผู้ใช้)
  // คงพฤติกรรมเดิมไว้เพื่อไม่ให้เจ้าหน้าที่ต้องพิมพ์ซ้ำ แต่ยังแก้เองได้
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [touchedPassword, setTouchedPassword] = useState(false);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg bg-(--danger-soft) px-3 py-2 text-center text-[13px] text-(--danger)">
          {state.error}
        </p>
      )}

      <label className="block text-left">
        <span className="mb-1 block text-[13px] text-(--muted)">รหัส (ID)</span>
        <input
          name="code"
          value={code}
          onChange={(e) => {
            const next = e.target.value.toUpperCase();
            setCode(next);
            if (!touchedPassword) setPassword(next);
          }}
          maxLength={8}
          autoCapitalize="characters"
          autoComplete="username"
          className="w-full rounded-lg border border-(--line) bg-white px-3 py-2.5 text-center tracking-widest"
          required
        />
      </label>

      <label className="block text-left">
        <span className="mb-1 block text-[13px] text-(--muted)">
          รหัสผ่าน (Password)
        </span>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setTouchedPassword(true);
            setPassword(e.target.value.toUpperCase());
          }}
          maxLength={32}
          autoComplete="current-password"
          className="w-full rounded-lg border border-(--line) bg-white px-3 py-2.5 text-center tracking-widest"
          required
        />
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-linear-to-r from-(--navy) to-(--hivis-dark) px-4 py-3.5 text-base font-bold text-white disabled:opacity-60"
      >
        {pending ? "กำลังตรวจสอบ..." : "เข้าสู่ระบบ"}
      </button>
    </form>
  );
}
