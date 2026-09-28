import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/auth";
import { getMyProfile } from "@/lib/data/queries";
import { Card } from "@/components/shell/ui";
import { LogoutIcon } from "@/components/shell/icons";
import {
  currentMonthISO,
  monthRange,
  thaiDateTime,
  thaiMonthLabel,
} from "@/lib/domain/datetime";

const LOGIN_ACTION: Record<string, string> = {
  login: "เข้าสู่ระบบ",
  logout: "ออกจากระบบ",
  failed: "รหัสผ่านผิด",
};

/** โปรไฟล์ — ข้อมูลเจ้าหน้าที่ที่ login อยู่ + เคสที่ตัวเองบันทึก + ประวัติเข้าระบบ */
export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const ym = currentMonthISO();
  const [from, to] = monthRange(ym);
  const me = await getMyProfile(session.accountId, from, to);

  return (
    <>
      <Card className="flex flex-col items-center px-4 pt-6 pb-5 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-linear-135 from-(--navy) to-(--blue-light) text-[26px] font-bold text-white shadow-(--card-shadow)">
          {(me.displayName || me.code).slice(0, 2)}
        </div>
        <div className="mt-3 text-[20px] font-bold">
          {me.displayName || me.code}
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-[12.5px]">
          <span className="rounded-full bg-(--page-bg) px-2.5 py-0.5 font-medium">
            รหัส {me.code}
          </span>
          <span
            className={`rounded-full px-2.5 py-0.5 font-medium ${
              me.isAdmin
                ? "bg-(--hivis-soft) text-(--hivis-dark)"
                : "bg-(--accent-soft) text-(--accent)"
            }`}
          >
            {me.isAdmin ? "ผู้ดูแลระบบ" : "เจ้าหน้าที่"}
          </span>
        </div>
        <div className="mt-2 text-[11.5px] text-(--muted)">
          ใช้งานตั้งแต่{" "}
          {thaiDateTime(me.createdAt).replace(/ \d{2}:\d{2}$/, "")}
        </div>
      </Card>

      {/* เคสที่เจ้าหน้าที่คนนี้เป็นผู้บันทึก */}
      <h2 className="mt-5 mb-2 text-[13px] font-semibold text-(--muted)">
        เคสที่ฉันบันทึก
      </h2>
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: "EMS", ...me.ems },
          { label: "Refer", ...me.refer },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <div className="text-[13px] font-semibold">{s.label}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-[30px] leading-none font-bold text-(--accent)">
                {s.month}
              </span>
              <span className="text-[12px] text-(--muted)">
                {thaiMonthLabel(ym)}
              </span>
            </div>
            <div className="mt-1.5 text-[12px] text-(--muted)">
              ทั้งหมด {s.total} เคส
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mt-5 mb-2 text-[13px] font-semibold text-(--muted)">
        ประวัติเข้าระบบล่าสุด
      </h2>
      <Card className="overflow-hidden">
        {me.logins.length === 0 ? (
          <p className="py-4 text-center text-[13px] text-(--muted)">
            ยังไม่มีประวัติ
          </p>
        ) : (
          <ul className="divide-y divide-(--line)">
            {me.logins.map((l, i) => (
              <li
                key={i}
                className="flex items-center justify-between gap-3 px-4 py-2.5 text-[13px]"
              >
                <span
                  className={
                    l.action === "failed" ? "text-(--danger)" : undefined
                  }
                >
                  {LOGIN_ACTION[l.action] ?? l.action}
                </span>
                <span className="text-(--muted)">{thaiDateTime(l.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <form action={logoutAction} className="mt-5">
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
