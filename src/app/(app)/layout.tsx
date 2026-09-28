import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import BackButton from "@/components/shell/BackButton";
import BottomNav from "@/components/shell/BottomNav";
import { UserIcon } from "@/components/shell/icons";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      {/* หัวแบบย่อ (navy + ขอบเขียวสะท้อนแสงแบบเดิม) — โลโก้ + ชื่อแอป · รหัสเจ้าหน้าที่ย้ายไปอยู่แท็บโปรไฟล์ */}
      <header className="sticky top-0 z-20 border-b-4 border-(--hivis) bg-linear-135 from-(--navy) to-(--blue-light) pt-[env(safe-area-inset-top)] text-white shadow-[0_2px_8px_rgba(0,0,0,.15)]">
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between gap-3 px-4">
          <div className="flex min-w-0 items-center gap-1">
            <BackButton />
            <Link href="/" className="flex min-w-0 items-center gap-2.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-er.jpg"
                alt=""
                className="size-9 shrink-0 rounded-full object-cover"
              />
              <span className="min-w-0 leading-tight">
                <span className="block text-[15px] font-bold">NKT Rescue</span>
                <span className="block truncate text-[11px] opacity-90">
                  ER รพร.นครไทย
                </span>
              </span>
            </Link>
          </div>
          <Link
            href="/profile"
            className="flex max-w-[45%] min-w-0 shrink-0 items-center gap-1.5 rounded-full bg-white/15 py-1 pr-3 pl-1 text-white"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-white/25">
              <UserIcon className="size-4" />
            </span>
            <span className="min-w-0 leading-tight">
              {/* ชื่อที่ตั้งเอง (ยังไม่ตั้ง = รหัส) + รหัสตัวเล็ก ให้รู้ว่าใครกำลัง login */}
              <span className="block truncate text-[12.5px] font-semibold">
                {session.displayName || session.code}
              </span>
              {session.displayName && (
                <span className="block truncate text-[10px] opacity-80">
                  {session.code}
                </span>
              )}
            </span>
          </Link>
        </div>
      </header>

      {/* เว้นท้ายหน้าเท่าความสูงแถบเมนูล่าง + safe-area — ปุ่มบันทึกท้ายฟอร์มจะไม่โดนบัง */}
      <main className="mx-auto max-w-[640px] px-4 pt-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+28px)]">
        {children}

        <p className="mt-8 text-center text-[11px] text-(--muted) opacity-70">
          nutunree seesai · Developer
        </p>
      </main>

      <BottomNav />
    </div>
  );
}
