import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/**
 * หน้าพิมพ์ไม่มีแถบหัว/แถบเจ้าหน้าที่ — กระดาษต้องมีแต่ตัวฟอร์ม
 * แต่ยังต้องล็อกอินเหมือนกัน (ลิงก์เปิดแท็บใหม่ ใช้ cookie เดียวกัน)
 */
export default async function PrintLayout({ children }: LayoutProps<"/">) {
  if (!(await getSession())) redirect("/login");
  return <div style={{ background: "#fff" }}>{children}</div>;
}
