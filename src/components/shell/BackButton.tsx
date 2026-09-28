"use client";

import { usePathname, useRouter } from "next/navigation";
import { ChevronLeftIcon } from "@/components/shell/icons";

/**
 * ปุ่มย้อนกลับบนหัวทุกหน้า (ยกเว้นหน้าหลัก)
 * ไม่มีประวัติให้ย้อน (เปิดลิงก์ตรง/แท็บใหม่) → กลับหน้าหลักแทน
 */
export default function BackButton() {
  const pathname = usePathname();
  const router = useRouter();
  if (pathname === "/") return null;

  return (
    <button
      type="button"
      aria-label="ย้อนกลับ"
      onClick={() =>
        window.history.length > 1 ? router.back() : router.push("/")
      }
      className="-ml-1.5 flex size-9 shrink-0 items-center justify-center rounded-full text-white active:bg-white/15"
    >
      <ChevronLeftIcon className="size-6" />
    </button>
  );
}
