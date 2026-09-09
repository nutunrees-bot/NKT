import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { importLegacySheet, probeSheet } from "@/lib/import/legacy-sheet";

/**
 * นำเข้าข้อมูลเก่าจาก Google Sheet ของระบบ GAS — ใช้ครั้งเดียวตอนย้ายระบบ
 *
 * ต้องล็อกอินก่อน · เรียกด้วย ?probe=1 เพื่อเช็กว่าเซิร์ฟเวอร์อ่านชีตได้ไหม
 * ก่อนนำเข้าจริง และ ?dry=1 เพื่อดูผลการแปลงโดยยังไม่เขียนลงฐานข้อมูล
 */
export async function GET(request: Request) {
  if (!(await getSession())) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

  const url = new URL(request.url);
  const sheetId = url.searchParams.get("sheet_id");
  if (!sheetId) {
    return NextResponse.json({ error: "ต้องระบุ sheet_id" }, { status: 400 });
  }

  const tabs = (url.searchParams.get("tabs") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  try {
    if (url.searchParams.get("probe")) {
      return NextResponse.json(await probeSheet(sheetId, tabs));
    }
    return NextResponse.json(
      await importLegacySheet(sheetId, tabs, !!url.searchParams.get("dry")),
    );
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ไม่ทราบสาเหตุ" },
      { status: 500 },
    );
  }
}
