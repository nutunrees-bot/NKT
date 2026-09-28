import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import BottomNav from "@/components/shell/BottomNav";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh">
      {/* หัวแบบย่อ — โลโก้ + ชื่อแอป · รหัสเจ้าหน้าที่ย้ายไปอยู่แท็บโปรไฟล์ */}
      <header className="sticky top-0 z-20 border-b border-(--line) bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[640px] items-center justify-between gap-3 px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-er.jpg"
              alt=""
              className="size-9 shrink-0 rounded-full object-cover"
            />
            <span className="min-w-0 leading-tight">
              <span className="block text-[15px] font-bold text-(--ink)">
                NKT Rescue
              </span>
              <span className="block truncate text-[11px] text-(--muted)">
                ER รพร.นครไทย
              </span>
            </span>
          </Link>
          <Link
            href="/profile"
            className="shrink-0 rounded-full bg-(--page-bg) px-3 py-1.5 text-[12px] font-medium text-(--muted)"
          >
            {session.code}
          </Link>
        </div>
      </header>

      {/* เว้นท้ายหน้าเท่าความสูงแถบเมนูล่าง + safe-area — ปุ่มบันทึกท้ายฟอร์มจะไม่โดนบัง */}
      <main className="mx-auto max-w-[640px] px-4 pt-4 pb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+28px)]">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
