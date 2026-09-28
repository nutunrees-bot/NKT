import { NextResponse, type NextRequest } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getEmsCase, getReferCase } from "@/lib/data/queries";
import { emsCaseWorkbook, referCaseWorkbook } from "@/lib/export/case-xlsx";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ดึงข้อมูลเคสเดียวเป็น Excel — /api/export/ems/<id> หรือ /api/export/refer/<id>
 * ข้อมูลผู้ป่วยทั้งเคส ต้องล็อกอินก่อนเสมอ (ยิงลิงก์ตรงได้ ไม่ได้ผ่านหน้าจอ)
 */
export async function GET(_req: NextRequest, ctx: RouteContext<"/api/export/[kind]/[id]">) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const { kind, id } = await ctx.params;
  if ((kind !== "ems" && kind !== "refer") || !UUID.test(id)) {
    return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });
  }

  const row = kind === "ems" ? await getEmsCase(id) : await getReferCase(id);
  if (!row) return NextResponse.json({ error: "ไม่พบเคส" }, { status: 404 });

  const buffer =
    kind === "ems" ? await emsCaseWorkbook(row) : await referCaseWorkbook(row);

  const date = String(kind === "ems" ? row.incident_date : row.refer_date);
  const name =
    kind === "ems"
      ? `EMS_${date}_เหตุที่${row.seq_no}.xlsx`
      : `REFER_${date}_${row.patient_hn || id.slice(0, 8)}.xlsx`;
  const ascii = kind === "ems" ? `EMS_${date}_${row.seq_no}.xlsx` : `REFER_${date}.xlsx`;

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
