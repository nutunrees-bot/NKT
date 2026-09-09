import PrintButton from "./PrintButton";
import { thaiDate } from "@/lib/domain/datetime";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

const css = `
@page { size: A4 portrait; margin: 15mm; }
.refer * { box-sizing: border-box; }
.refer {
  font-family: var(--font-thai-sans), "TH Sarabun New", sans-serif;
  font-size: 15px; color: #000; line-height: 1.6; padding: 6px; background: #fff;
}
.refer h1 { font-size: 20px; text-align: center; margin: 0 0 18px; }
.refer .box { border: 1.5px solid #000; padding: 16px 20px; }
.refer .row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 22px; margin: 8px 0; }
.refer .fld { white-space: nowrap; }
.refer .line { display: inline-block; border-bottom: 1px dotted #000; min-width: 60px; padding: 0 4px; font-weight: 600; }
.refer .sec-title { font-weight: 700; margin: 18px 0 6px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
.refer .chk { white-space: nowrap; margin-right: 16px; }
.refer .blankline { border-bottom: 1px dotted #000; display: inline-block; min-width: 220px; }
.refer .sign-row { display: flex; justify-content: space-between; margin-top: 60px; }
.refer .sign-box { text-align: center; width: 45%; }
@media print { .no-print { display: none !important; } }
`;

const Box = ({ on }: { on: boolean }) => <>{on ? "☑" : "☐"}</>;

function Line({ value, w = 60 }: { value?: string; w?: number }) {
  return (
    <span className="line" style={{ minWidth: w }}>
      {value ?? ""}
    </span>
  );
}

export default function ReferPrint({
  row,
  recordedBy,
}: {
  row: Row;
  recordedBy: string;
}) {
  const severity = s(row.severity);

  return (
    <div className="refer">
      <style>{css}</style>
      <PrintButton />

      <h1>
        แบบบันทึกการส่งต่อผู้ป่วย (REFER)
        <br />
        ER รพ.สมเด็จพระยุพราชนครไทย
      </h1>

      <div className="box">
        <div className="row">
          <span className="fld">
            วันที่ <Line value={thaiDate(s(row.refer_date))} w={120} />
          </span>
          <span className="fld">
            ผู้บันทึก <Line value={recordedBy} w={140} />
          </span>
        </div>

        <div className="sec-title">ข้อมูลผู้ป่วย</div>
        <div className="row">
          <span className="fld">
            ชื่อ-สกุลผู้ป่วย <Line value={s(row.patient_name)} w={260} />
          </span>
          <span className="fld">
            อายุ <Line value={s(row.patient_age)} w={50} /> ปี
          </span>
        </div>
        <div className="row">
          <span className="fld">
            HN <Line value={s(row.patient_hn)} w={130} />
          </span>
        </div>
        <div className="row">
          <span className="fld">
            Dx (การวินิจฉัย) <Line value={s(row.dx)} w={400} />
          </span>
        </div>
        <div className="row">
          <span className="chk">
            <Box on={s(row.trauma_type) === "Trauma"} /> Trauma
          </span>
          <span className="chk">
            <Box on={s(row.trauma_type) === "Non-Trauma"} /> Non-Trauma
          </span>
        </div>
        <div className="row">
          ระดับความรุนแรง
          <span className="chk">
            <Box on={severity === "ระดับวิกฤต (ฉุกเฉินสีแดง)"} /> วิกฤต (แดง)
          </span>
          <span className="chk">
            <Box on={severity === "ระดับฉุกเฉิน (ฉุกเฉินสีเหลือง)"} /> ฉุกเฉิน
            (เหลือง)
          </span>
          <span className="chk">
            <Box on={severity === "ระดับเร่งด่วน (ฉุกเฉินสีเขียว)"} /> เร่งด่วน
            (เขียว)
          </span>
          <span className="chk">
            <Box on={severity === "ระดับไม่เร่งด่วน (ปกติ)"} /> ไม่เร่งด่วน (ขาว)
          </span>
        </div>

        <div className="sec-title">การส่งต่อ</div>
        <div className="row">
          <span className="fld">
            ส่งต่อโรงพยาบาล <Line value={s(row.refer_hospital)} w={300} />
          </span>
        </div>
        <div className="row">
          <span className="fld">
            โดย (ทีมนำส่ง) <Line value={s(row.team)} w={220} />
          </span>
        </div>
        <div className="row">
          <span className="fld">
            Refer สาขา<span className="blankline">&nbsp;</span>
          </span>
        </div>

        <div className="sign-row">
          <div className="sign-box">
            ลงชื่อ .......................................... ผู้ส่งต่อ
            <br />
            วันที่ ....../....../......
          </div>
          <div className="sign-box">
            ลงชื่อ .......................................... ผู้รับส่งต่อ
            <br />
            วันที่ ....../....../......
          </div>
        </div>
      </div>
    </div>
  );
}
