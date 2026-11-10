import { redirect } from "next/navigation";
import { getAmbulanceData } from "@/lib/data/ambulance";
import { getSession } from "@/lib/auth/session";
import { daysBefore, nowHM, shiftOf, todayISO } from "@/lib/domain/datetime";
import { PageHeader } from "@/components/shell/ui";
import AmbulanceBoard from "@/components/ambulance/AmbulanceBoard";

/**
 * Ambulance — ทะเบียนรถ + สถานะ + เช็คของภายในรถรายวันแยกเวร
 * เจ้าหน้าที่เข้าจากปุ่มในโปรไฟล์ · พขร. เข้าระบบแล้วมาหน้านี้หน้าเดียว
 * (พขร. เปลี่ยนสถานะ/เช็คของได้ แต่เพิ่ม-เอารถออก/แก้รายการของไม่ได้)
 */
export default async function AmbulancePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const canManage = session.role === "staff";
  const today = todayISO();
  const currentShift = shiftOf(nowHM()) ?? "เช้า";

  let data: Awaited<ReturnType<typeof getAmbulanceData>>;
  try {
    data = await getAmbulanceData(daysBefore(today, 30));
  } catch (e) {
    // ยังไม่ได้รัน supabase/v2/0004_ambulance.sql = ยังไม่มีตาราง
    return (
      <div className="page-wide">
        <PageHeader title="Ambulance" />
        <p className="rounded-2xl bg-white p-5 text-[13.5px] shadow-(--card-shadow)">
          โหลดข้อมูลรถพยาบาลไม่สำเร็จ — ถ้าเพิ่งเปิดใช้ ให้ผู้ดูแลรัน
          <code className="mx-1 rounded bg-(--page-bg) px-1">supabase/v2/0004_ambulance.sql</code>
          ใน Supabase SQL Editor ก่อน
          <br />
          <span className="text-[12px] text-(--muted)">
            ({e instanceof Error ? e.message : String(e)})
          </span>
        </p>
      </div>
    );
  }

  return (
    // page-wide: เต็มจอบนคอม (globals.css) · มือถือคงเดิม
    <div className="page-wide">
      <PageHeader title="Ambulance" subtitle="สถานะรถพยาบาล · เช็คของภายในรถรายวันแยกเวร" />
      <AmbulanceBoard
        {...data}
        today={today}
        currentShift={currentShift}
        canManage={canManage}
      />
    </div>
  );
}
