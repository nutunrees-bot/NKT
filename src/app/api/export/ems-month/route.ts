import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { listEmsRegister } from "@/lib/data/queries";
import { monthRange, thaiMonthShort } from "@/lib/domain/datetime";
import { emsMonthlyRegisterWorkbook } from "@/lib/export/register-xlsx";

/**
 * ทะเบียนออกเหตุ EMS รายเดือนเป็น Excel — /api/export/ems-month?ym=2026-09
 * (ym เป็น ค.ศ. แบบเดียวกับหน้า /area) · ข้อมูลผู้ป่วย ต้องล็อกอินก่อนเสมอ
 */
export async function GET(req: NextRequest) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const ym = req.nextUrl.searchParams.get("ym") ?? "";
  const m = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!m || Number(m[2]) < 1 || Number(m[2]) > 12) {
    return NextResponse.json({ error: "เดือนไม่ถูกต้อง (ใช้ ym=YYYY-MM)" }, { status: 400 });
  }

  const [from, to] = monthRange(ym);
  const rows = await listEmsRegister(from, to);
  const buffer = await emsMonthlyRegisterWorkbook(ym, rows);

  const name = `EMS ${thaiMonthShort(ym)}.xlsx`;
  const ascii = `EMS_${ym}.xlsx`;

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`,
      // ข้อมูลผู้ป่วย — ห้าม cache ที่ไหน
      "Cache-Control": "private, no-store",
    },
  });
}
