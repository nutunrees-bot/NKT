import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import {
  importLegacySheet,
  probeSheet,
  resetCases,
} from "@/lib/import/legacy-sheet";

/**
 * นำเข้าข้อมูลเก่าจาก Google Sheet ของระบบ GAS — ใช้ครั้งเดียวตอนย้ายระบบ
 *
 * ต้องล็อกอินก่อน · เรียกด้วย ?probe=1 เพื่อเช็กว่าเซิร์ฟเวอร์อ่านชีตได้ไหม
 * ก่อนนำเข้าจริง และ ?dry=1 เพื่อดูผลการแปลงโดยยังไม่เขียนลงฐานข้อมูล
 */
export async function GET(request: Request) {
  // ปิดไว้เป็นค่าเริ่มต้น — เปิดเฉพาะตอนย้ายระบบด้วยการตั้ง LEGACY_IMPORT_TOKEN
  // (เส้นทางนี้มี reset=1 ที่ลบเคสทั้งหมดได้ ไม่ควรเปิดค้างไว้ให้ใครก็เรียกได้)
  const token = process.env.LEGACY_IMPORT_TOKEN;
  const url = new URL(request.url);
  if (!token || url.searchParams.get("token") !== token) {
    return NextResponse.json({ error: "ไม่พบเส้นทางนี้" }, { status: 404 });
  }

  if (!(await getSession())) {
    return NextResponse.json({ error: "ต้องเข้าสู่ระบบก่อน" }, { status: 401 });
  }

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
    const dry = !!url.searchParams.get("dry");
    // reset=1 ลบเคสทั้งหมดก่อน เพื่อนำเข้าใหม่ให้สะอาด (ต้องสั่งชัดเจนเท่านั้น)
    if (url.searchParams.get("reset") && !dry) await resetCases();

    return NextResponse.json({
      reset: !!url.searchParams.get("reset") && !dry,
      ...(await importLegacySheet(sheetId, tabs, dry)),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "ไม่ทราบสาเหตุ" },
      { status: 500 },
    );
  }
}
