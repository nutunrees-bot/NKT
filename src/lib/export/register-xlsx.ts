import ExcelJS from "exceljs";
import type { EmsRegisterRow } from "@/lib/data/queries";
import { thaiMonthLabel, thaiMonthShort } from "@/lib/domain/datetime";
import {
  REGISTER_COLUMNS as COLUMNS,
  registerHeaderGroups,
  registerRow,
  registerTotals,
} from "@/lib/domain/register";

/**
 * ทะเบียนออกเหตุ EMS รายเดือนเป็นไฟล์ Excel
 * ผังคอลัมน์/ค่าแต่ละช่องอยู่ที่ src/lib/domain/register.ts (ใช้ร่วมกับหน้า /register)
 */

const FONT = "Tahoma";
const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FFCFE2F3" }, // ฟ้าอ่อนแบบหัวตารางในชีตเดิม
};
const THIN: ExcelJS.Border = { style: "thin", color: { argb: "FF7F8C99" } };
const BORDER: Partial<ExcelJS.Borders> = {
  top: THIN,
  left: THIN,
  bottom: THIN,
  right: THIN,
};

export async function emsMonthlyRegisterWorkbook(
  ym: string,
  rows: EmsRegisterRow[],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "NKT Rescue";
  // ให้ Excel คำนวณสูตรแถวรวมใหม่ทุกครั้งที่เปิด (เผื่อแก้ตัวเลขในไฟล์ต่อ)
  wb.calcProperties.fullCalcOnLoad = true;

  const ws = wb.addWorksheet(thaiMonthShort(ym), {
    views: [{ state: "frozen", ySplit: 3, xSplit: 0 }],
    pageSetup: {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
      margins: {
        left: 0.3,
        right: 0.3,
        top: 0.4,
        bottom: 0.4,
        header: 0.2,
        footer: 0.2,
      },
      printTitlesRow: "2:3",
    },
  });
  ws.columns = COLUMNS.map((c) => ({ width: c.width }));
  const last = COLUMNS.length;

  // แถว 1: ชื่อทะเบียน
  ws.getCell(1, 1).value = `ทะเบียนออกเหตุ EMS เดือน ${thaiMonthLabel(ym)}`;
  ws.mergeCells(1, 1, 1, last);
  ws.getRow(1).height = 24;
  ws.getCell(1, 1).font = { name: FONT, size: 13, bold: true };
  ws.getCell(1, 1).alignment = { horizontal: "center", vertical: "middle" };

  // แถว 2–3: หัวตาราง 2 ชั้น
  for (const g of registerHeaderGroups()) {
    const col = g.start + 1;
    ws.getCell(2, col).value = g.label;
    if (g.single) {
      ws.mergeCells(2, col, 3, col);
      continue;
    }
    if (g.span > 1) ws.mergeCells(2, col, 2, col + g.span - 1);
    for (let k = 0; k < g.span; k++)
      ws.getCell(3, col + k).value = COLUMNS[g.start + k].label;
  }
  for (const r of [2, 3]) {
    ws.getRow(r).height = 20;
    for (let k = 1; k <= last; k++) {
      const cell = ws.getCell(r, k);
      cell.fill = HEADER_FILL;
      cell.border = BORDER;
      cell.font = { name: FONT, size: 10, bold: true };
      cell.alignment = {
        horizontal: "center",
        vertical: "middle",
        wrapText: true,
      };
    }
  }

  // ข้อมูล
  rows.forEach((row, i) => {
    const values = registerRow(row, i);
    const excelRow = ws.addRow(values);
    excelRow.eachCell({ includeEmpty: true }, (cell, colNo) => {
      const col = COLUMNS[colNo - 1];
      cell.border = BORDER;
      cell.font = { name: FONT, size: 10 };
      const left = col.label === "ชื่อ-สกุล" || col.label === "ศูนย์รับ/ผู้ออก";
      cell.alignment = {
        horizontal: left ? "left" : "center",
        vertical: "middle",
      };
      // เลขปฏิบัติการ/HN เป็นข้อความ กัน Excel ตัดเลข 0 นำหน้า
      if (col.label === "เลขปฏิบัติการ" || col.label === "HN")
        cell.numFmt = "@";
    });
  });

  // แถวรวม
  const first = 4;
  const lastData = 3 + rows.length;
  const total = ws.addRow([]);
  total.getCell(1).value = "รวม";
  ws.mergeCells(total.number, 1, total.number, 4);
  const sums = registerTotals(rows);
  COLUMNS.forEach((col, k) => {
    const sum = sums[k];
    if (sum === null) return;
    const letter = ws.getColumn(k + 1).letter;
    total.getCell(k + 1).value =
      rows.length > 0
        ? {
            formula: `SUM(${letter}${first}:${letter}${lastData})`,
            result: sum,
          }
        : 0;
  });
  for (let k = 1; k <= last; k++) {
    const cell = total.getCell(k);
    cell.border = BORDER;
    cell.fill = HEADER_FILL;
    cell.font = { name: FONT, size: 10, bold: true };
    cell.alignment = { horizontal: "center", vertical: "middle" };
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}
