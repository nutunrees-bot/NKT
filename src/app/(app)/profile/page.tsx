import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { Card } from "@/components/shell/ui";
import {
  ChevronRightIcon,
  LogoutIcon,
  PinIcon,
  PrinterIcon,
  RegistryIcon,
} from "@/components/shell/icons";

/** โปรไฟล์ — รหัสเจ้าหน้าที่ที่เข้าระบบอยู่ + ลิงก์ที่เคยอยู่แถบบน + ออกจากระบบ */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const links = [
    { href: "/area", label: "สรุป EMS & REFER รายเดือน", icon: PinIcon, blank: false },
    { href: "/registry", label: "ค้นทะเบียนผู้ป่วย", icon: RegistryIcon, blank: false },
    { href: "/print/als/blank", label: "พิมพ์ฟอร์ม ALS เปล่า", icon: PrinterIcon, blank: true },
  ];

  return (
    <>
      <Card className="flex flex-col items-center px-4 pt-6 pb-5 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-er.jpg"
          alt="NKT ER"
          className="size-20 rounded-full object-cover shadow-(--card-shadow)"
        />
        <div className="mt-3 text-[12.5px] text-(--muted)">เข้าสู่ระบบด้วยรหัส</div>
        <div className="text-[24px] font-bold tracking-wide">{session.code}</div>
        <div className="mt-1 text-[12px] text-(--muted)">
          NKT Rescue · ER โรงพยาบาลสมเด็จพระยุพราชนครไทย
        </div>
      </Card>

      <Card className="mt-4 overflow-hidden">
        <ul className="divide-y divide-(--line)">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  target={l.blank ? "_blank" : undefined}
                  className="flex items-center gap-3 px-4 py-3.5 text-[14px] active:bg-(--page-bg)"
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-(--accent-soft) text-(--accent)">
                    <Icon className="size-5" />
                  </span>
                  <span className="flex-1 font-medium">{l.label}</span>
                  <ChevronRightIcon className="size-5 text-(--muted)" />
                </Link>
              </li>
            );
          })}
        </ul>
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
