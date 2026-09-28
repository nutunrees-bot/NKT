"use client";

import { useActionState } from "react";
import {
  updateDisplayNameAction,
  type DisplayNameState,
} from "@/lib/actions/profile";

/** ฟอร์มตั้งชื่อที่แสดงของเจ้าหน้าที่ — ในหน้าโปรไฟล์ */
export default function DisplayNameForm({
  current,
}: {
  current: string | null;
}) {
  const [state, action, pending] = useActionState<DisplayNameState, FormData>(
    updateDisplayNameAction,
    {},
  );

  return (
    <form action={action}>
      <label className="mb-1.5 block text-[13px] font-semibold text-(--muted)">
        ชื่อ-สกุล ที่แสดงในระบบ
      </label>
      <div className="flex gap-2">
        <input
          name="display_name"
          defaultValue={current ?? ""}
          maxLength={60}
          placeholder="เช่น นายสมชาย ใจดี"
          className="min-w-0 flex-1 rounded-xl border border-(--line) bg-(--page-bg) px-3 py-2.5"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-xl bg-(--accent) px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก…" : "บันทึก"}
        </button>
      </div>
      {state.error && (
        <p className="mt-1.5 text-[12.5px] text-(--danger)">{state.error}</p>
      )}
      {state.ok && !pending && (
        <p className="mt-1.5 text-[12.5px] text-(--hivis-dark)">
          บันทึกชื่อแล้ว ✓
        </p>
      )}
    </form>
  );
}
