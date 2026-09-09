"use client";

import { useTransition } from "react";

export default function DeleteCaseButton({
  id,
  action,
  label = "ลบ",
}: {
  id: string;
  action: (id: string) => Promise<void>;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("ยืนยันลบเคสนี้? เมื่อลบแล้วกู้คืนไม่ได้")) return;
        startTransition(async () => {
          await action(id);
        });
      }}
      className="rounded-lg border border-[#f6cfcb] bg-(--danger-soft) px-3 py-2 text-[12.5px] text-(--danger) disabled:opacity-50"
    >
      {pending ? "กำลังลบ..." : label}
    </button>
  );
}
