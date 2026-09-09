/**
 * กฎที่ฟอร์ม ALS ใช้เติมช่องให้อัตโนมัติ — ยกมาจาก buildALSFormHtml_ ในระบบเดิม
 * แยกออกมาเป็นฟังก์ชันล้วนๆ เพราะเป็นกฎเชิงเวชระเบียน ไม่ใช่เรื่องการจัดหน้า
 */

/** เดาเพศจากคำนำหน้าชื่อที่เจ้าหน้าที่พิมพ์ — ไม่ตรงรูปแบบไหนเลยก็ไม่ติ๊กทั้งคู่ */
export function guessSex(name: string): { male: boolean; female: boolean } {
  const s = (name ?? "").trim();
  if (/^(นาง(สาว)?|เด็กหญิง|ด\.ญ\.?|น\.ส\.?)/.test(s))
    return { male: false, female: true };
  if (/^(นาย|เด็กชาย|ด\.ช\.?)/.test(s)) return { male: true, female: false };
  return { male: false, female: false };
}

/**
 * ข้อ 5 ของฟอร์ม: ติ๊กให้จากสิ่งที่ทำไปในข้อ 3
 *  - ไม่ได้เลือกอะไร หรือเลือกแค่ "No" → "ไม่จำเป็น"
 *  - เลือกวิธีการอื่น → "ทำและเหมาะสม"
 * ส่วน "ไม่ได้ทำ" กับ "ทำแต่ไม่เหมาะสม" ต้องใช้ดุลยพินิจผู้ประเมิน จึงเว้นให้ติ๊กเอง
 */
export function evaluateTreatment(values: string[]): "none" | "done" {
  const list = (values ?? []).filter(Boolean);
  if (list.length === 0) return "none";
  if (list.length === 1 && list[0] === "No") return "none";
  return "done";
}

/** ต่อท้ายชื่อด้วย (RN)/(AEMT) ตามบทบาทจริง — ชื่อที่พิมพ์เองจะไม่ต่อท้าย */
export function withStaffRole(
  name: string,
  roleByName: Map<string, string[]>,
): string {
  if (!name) return "";
  const roles = roleByName.get(name) ?? [];
  if (roles.includes("rn")) return `${name} (RN)`;
  if (roles.includes("aemt")) return `${name} (AEMT)`;
  return name;
}

export function kmBetween(
  from: number | null,
  to: number | null,
): string {
  if (from === null || to === null) return "";
  return String(Math.round((to - from) * 100) / 100);
}
