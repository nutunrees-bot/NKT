import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/shell/AppShell";

/**
 * ทุกหน้าในกลุ่มนี้ = เฉพาะเจ้าหน้าที่ ER
 * พขร. เข้าได้แค่หน้า Ambulance ซึ่งแยกไปอยู่กลุ่ม (fleet) — เข้าหน้าอื่นถูกส่งไปที่นั่น
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "driver") redirect("/ambulance");

  return <AppShell session={session}>{children}</AppShell>;
}
