/**
 * CSS ของฟอร์ม ALS — เขียนเป็น CSS ธรรมดา ไม่ใช้ Tailwind
 *
 * ฟอร์มนี้ต้องลงกระดาษ A4 หน้าเดียวพอดีเหมือนของเดิมเป๊ะๆ ค่าขนาดทุกตัว
 * (10.2px, 1.18 line-height, 2.4px padding) ปรับจนพอดีมาแล้ว — แตะแล้วล้น
 */
export const alsCss = `
@page { size: A4 portrait; margin: 4mm; }
.als * { box-sizing: border-box; }
.als {
  font-family: var(--font-thai-sans), "TH Sarabun New", sans-serif;
  font-size: 10.2px;
  color: #000;
  line-height: 1.18;
  background: #fff;
  padding: 4px;
  display: flex;
  flex-direction: column;
  min-height: calc(297mm - 8mm);
}
.als h1 { font-size: 14px; text-align: center; margin: 0 0 3.2px; font-weight: 700; flex-shrink: 0; }
.als .frame {
  border: 1.5px solid #000;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  position: relative;
}
.als .frame.blank { display: block; flex: none; }
.als .stamp {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%) rotate(-28deg);
  font-size: 150px; font-weight: 900; letter-spacing: 10px;
  color: rgba(200,0,0,.45); border: 10px solid rgba(200,0,0,.45);
  padding: 10px 26px; z-index: 9; pointer-events: none; white-space: nowrap; line-height: 1;
}
.als .sec { border-top: 1.5px solid #000; padding: 2.4px 9px; }
.als .sec:first-child { border-top: none; }
.als .sec-title { font-weight: 700; margin-bottom: 1.6px; }
.als .row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 1.6px 14.5px; margin: 1.6px 0; }
.als .fld { white-space: nowrap; }
.als .line { display: inline-block; border-bottom: 1px dotted #000; min-width: 60px; padding: 0 3px; font-weight: 600; }
.als table { border-collapse: collapse; width: 100%; margin: 2.8px 0; }
.als th, .als td { border: 1px solid #000; padding: 1.5px 3.5px; font-size: 9.7px; text-align: center; }
.als th { font-weight: 700; background: #f2f2f2; }
.als .chklist { display: flex; flex-wrap: wrap; gap: 1.6px 12px; margin: 1px 0; }
.als .subrow { display: flex; gap: 7.3px; margin: .4px 0; }
.als .subrow .lbl { min-width: 150px; font-weight: 600; }
.als .grp { display: flex; border: 1px solid #000; margin: 1.2px 0; }
.als .grp-label {
  writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg);
  font-weight: 700; font-size: 9px; text-align: center; padding: 2.5px 1px;
  border-right: 1px solid #000; background: #f2f2f2;
  display: flex; align-items: center; justify-content: center; white-space: nowrap; flex-shrink: 0;
}
.als .grp-body { flex: 1; padding: 1px 6px; min-width: 0; }
.als .grp-body .subrow { margin: .6px 0; }
.als .box-table { border: 1px solid #000; }
.als .box-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 1.6px 14.5px; padding: 1.5px 6px; border-bottom: 1px solid #000; }
.als .box-row:last-child { border-bottom: none; }
.als .hatch { background-image: repeating-linear-gradient(45deg,#ccc,#ccc 2px,#fff 2px,#fff 6px); }
.als .big-zone { font-size: 1.04em; }
.als .big-zone th, .als .big-zone td { font-size: 1.02em; }
.als .big-zone .line { font-weight: 700; }
.als .footnote { font-size: 9px; color: #555; margin-top: 2.5px; border-top: 1px dashed #999; padding-top: 1.3px; }
.als .sysnote { font-size: 9px; color: #0a6; margin-top: 1.5px; }
.als .sig-img { height: 28px; border-bottom: 1px dotted #000; }
@media print { .no-print { display: none !important; } }
`;
