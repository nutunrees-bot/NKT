import { redirect } from "next/navigation";

/** หน้าสรุปเดิมย้ายไปแท็บ "พื้นที่" แล้ว — ลิงก์/บุ๊กมาร์กเก่ายังใช้ได้ */
export default async function SummaryRedirect({ searchParams }: PageProps<"/summary">) {
  const sp = await searchParams;
  const raw = Array.isArray(sp.ym) ? sp.ym[0] : sp.ym;
  redirect(raw && /^\d{4}-\d{2}$/.test(raw) ? `/area?ym=${raw}` : "/area");
}
