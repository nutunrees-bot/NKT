import type { MetadataRoute } from "next";

/**
 * ให้เจ้าหน้าที่กด "เพิ่มลงในหน้าจอโฮม" บนมือถือแล้วได้ไอคอนโรงพยาบาล
 * และเปิดแบบเต็มจอเหมือนแอป (ส่วนใหญ่กรอกงานหน้างานจากมือถือ)
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NKT Rescue — บันทึก EMS และการส่งต่อผู้ป่วย",
    short_name: "NKT Rescue",
    description:
      "ระบบบันทึกปฏิบัติการการแพทย์ฉุกเฉินและการส่งต่อผู้ป่วย ER โรงพยาบาลสมเด็จพระยุพราชนครไทย",
    lang: "th",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f1f6f3",
    theme_color: "#0a2e4d",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
