import type { Metadata, Viewport } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";

const notoSansThai = Noto_Sans_Thai({
  variable: "--font-thai-sans",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "NKT Rescue",
  description:
    "ระบบบันทึกปฏิบัติการฉุกเฉินและการส่งต่อผู้ป่วย ER โรงพยาบาลสมเด็จพระยุพราชนครไทย",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a2e4d",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="th" className={notoSansThai.variable}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
