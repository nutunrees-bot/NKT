import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/shell/ui";
import { LogoutIcon, UserIcon } from "@/components/shell/icons";

/** โปรไฟล์ — การ์ดบอกว่าใคร login อยู่ + ปุ่มออกจากระบบ */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <>
      <Card className="flex flex-col items-center px-4 pt-6 pb-5 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-linear-135 from-(--navy) to-(--blue-light) text-white shadow-(--card-shadow)">
          <UserIcon className="size-10" />
        </div>
        <div className="mt-3 text-[20px] font-bold">
          {session.displayName || session.code}
        </div>
        {session.displayName && (
          <div className="mt-1 rounded-full bg-(--page-bg) px-2.5 py-0.5 text-[12.5px] font-medium">
            รหัส {session.code}
          </div>
        )}
        <div className="mt-2 text-[12px] text-(--muted)">
          NKT Rescue · ER โรงพยาบาลสมเด็จพระยุพราชนครไทย
        </div>
      </Card>

      <form action={logoutAction} className="mt-4">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f6cfcb] bg-(--danger-soft) py-3.5 text-[15px] font-semibold text-(--danger)"
        >
          <LogoutIcon className="size-5" /> ออกจากระบบ
        </button>
      </form>
    </>
  );
}
