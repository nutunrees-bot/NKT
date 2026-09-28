import { logoutAction } from "@/lib/actions/auth";
import { LogoutIcon } from "@/components/shell/icons";

/** โปรไฟล์ — ปุ่มออกจากระบบอย่างเดียว (ชื่อคนที่ login อยู่บนหัวทุกหน้าแล้ว) */
export default function ProfilePage() {
  return (
    <form action={logoutAction} className="mt-2">
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f6cfcb] bg-(--danger-soft) py-3.5 text-[15px] font-semibold text-(--danger)"
      >
        <LogoutIcon className="size-5" /> ออกจากระบบ
      </button>
    </form>
  );
}
