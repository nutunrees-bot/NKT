import { NextResponse, type NextRequest } from "next/server";
import { getStaffSession } from "@/lib/auth/session";
import { getEmsCase } from "@/lib/data/queries";
import { emsCaseWorkbook } from "@/lib/export/case-xlsx";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ดึงข้อมูลเคส EMS เดียวเป็น Excel — /api/export/ems/<id>
 * ข้อมูลผู้ป่วยทั้งเคส ต้องล็อกอินก่อนเสมอ (ยิงลิงก์ตรงได้ ไม่ได้ผ่านหน้าจอ)
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/export/[kind]/[id]">) {
  if (!(await getStaffSession())) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const { kind, id } = await ctx.params;
  if (kind !== "ems" || !UUID.test(id)) {
    return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  const row = await getEmsCase(id);
  if (!row) return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });

  const buffer = await emsCaseWorkbook(row);

  const date = String(row.incident_date);
  const name = `EMS_${date}_เหตุที่${row.seq_no}.xlsx`;
  const ascii = `EMS_${date}_${row.seq_no}.xlsx`;

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
