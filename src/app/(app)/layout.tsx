import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-dvh pb-10">
      <header className="sticky top-0 z-10 border-b-4 border-(--hivis) bg-linear-135 from-(--navy) to-(--blue-light) px-4 pt-3.5 pb-4 text-center text-white shadow-[0_2px_8px_rgba(0,0,0,.15)]">
        <Link href="/" className="text-[22px] font-semibold">
          🚑 NKT Rescue
        </Link>
        <div className="mt-0.5 text-[12.5px] opacity-90">
          ER Nakhonthai Crown Prince Hospital
        </div>
      </header>

      <div className="mx-auto mt-3 flex max-w-[640px] items-center justify-between gap-2 rounded-xl border border-(--line) bg-(--card) px-3.5 py-2 text-[12.5px]">
        <span>
          เจ้าหน้าที่: <b>{session.code}</b>
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/summary"
            className="rounded-lg bg-(--hivis-soft) px-3 py-1.5 text-(--hivis-dark)"
          >
            📊 สรุป
          </Link>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-[#f6cfcb] bg-(--danger-soft) px-3 py-1.5 text-(--danger)"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>

      <main className="mx-auto max-w-[640px] px-4 py-4">{children}</main>
    </div>
  );
}
