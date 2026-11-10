import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AppShell from "@/components/shell/AppShell";

/**
 * กลุ่มหน้าที่ พขร. (driver) เข้าได้ด้วย — ตอนนี้มีแค่ /ambulance
 * เจ้าหน้าที่ ER เข้าได้ตามปกติ (หน้าตาเดียวกับกลุ่ม (app))
 */
export default async function FleetLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  if (!session) redirect("/login");

  return <AppShell session={session}>{children}</AppShell>;
}
