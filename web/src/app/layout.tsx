import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import AppHeader from "@/components/AppHeader";
import AppTabs from "@/components/AppTabs";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NKT Rescue & Refer",
  description:
    "ศูนย์ข้อมูลกู้ชีพ ส่งต่อผู้ป่วย และคัดกรองฉุกเฉิน โรงพยาบาลสมเด็จพระยุพราชนครไทย",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={`${notoSansThai.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">
        <AppHeader />
        <AppTabs />
        <main className="flex-1 bg-(--page-bg)">{children}</main>
      </body>
    </html>
  );
}
