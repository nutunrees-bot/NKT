import PrintButton from "./PrintButton";
import { alsCss } from "./alsCss";
import {
  evaluateTreatment,
  guessSex,
  kmBetween,
  withStaffRole,
} from "@/lib/domain/als";
import { DEATH_AT_SCENE, MULTI_GROUPS } from "@/lib/domain/options";
import { hm, thaiDate } from "@/lib/domain/datetime";
import type { AttachmentUrls } from "@/lib/domain/ems";

type Row = Record<string, unknown>;

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));
const n = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  const x = Number(v);
  return Number.isNaN(x) ? null : x;
};

const Box = ({ on }: { on: boolean }) => <>{on ? "☑" : "☐"}</>;

function Line({ value, w = 60 }: { value?: string | number | null; w?: number }) {
  return (
    <span className="line" style={{ minWidth: w }}>
      {value === null || value === undefined ? "" : String(value)}
    </span>
  );
}

/** ติ๊กรายการจากค่าที่เลือกไว้ (array ใน DB) */
function CheckList({ options, chosen }: { options: readonly string[]; chosen: string[] }) {
  return (
    <>
      {options.map((opt, i) => (
        <span key={opt}>
          {i > 0 && "   "}
          <Box on={chosen.includes(opt)} /> {opt}
        </span>
      ))}
    </>
  );
}

export default function AlsForm({
  row,
  vitals,
  attachments,
  roleByName,
  recordedBy,
  blank = false,
}: {
  row: Row;
  vitals: Row[];
  attachments: AttachmentUrls;
  /** ชื่อ -> บทบาท ใช้ต่อท้าย (RN)/(AEMT) */
  roleByName: Map<string, string[]>;
  recordedBy: string;
  blank?: boolean;
}) {
  const arr = (key: string) => (row[key] as string[]) ?? [];
  const sex = guessSex(s(row.patient_name));
  const isDeathAtScene = s(row.initial_care_result) === DEATH_AT_SCENE;
  const severity = s(row.severity);
  /** เสียชีวิต ณ จุดเกิดเหตุ = บังคับ RC Code เป็นดำ ทับระดับที่เลือกไว้ */
  const rc = (color: string) =>
    isDeathAtScene ? color === "สีดำ" : severity === color;

  const isThai =
    s(row.nationality) === "คนไทย" ||
    (!s(row.nationality) && !!s(row.patient_national_id));
  const isMigrant = s(row.nationality) === "แรงงานต่างด้าว";
  const isForeign = s(row.nationality) === "ชาวต่างชาติ";

  const mileOut = n(row.mile_out);
  const mileScene = n(row.mile_scene);
  const mileHospital = n(row.mile_hospital);
  const mileStation = n(row.mile_station);

  // แถวสัญญาณชีพ: ชุดแรกจากเคส + ชุดประเมินซ้ำ + เติมแถวว่างให้ครบอย่างน้อย 2 แถว
  const vitalRows = [
    {
      time: hm(s(row.t_arrive_scene)),
      bt: s(row.bt),
      bp: s(row.bp),
      pr: s(row.pr),
      rr: s(row.rr),
      e: s(row.gcs_e),
      v: s(row.gcs_v),
      m: s(row.gcs_m),
      lt: s(row.pupil_l),
      rt: s(row.pupil_r),
      o2: s(row.o2sat),
      dtx: s(row.dtx),
    },
    ...vitals.map((v) => ({
      time: hm(s(v.measured_at)),
      bt: s(v.bt),
      bp: s(v.bp),
      pr: s(v.pr),
      rr: s(v.rr),
      e: s(v.gcs_e),
      v: s(v.gcs_v),
      m: s(v.gcs_m),
      lt: s(v.pupil_l),
      rt: s(v.pupil_r),
      o2: s(v.o2sat),
      dtx: s(v.dtx),
    })),
  ];
  while (vitalRows.length < 3) {
    vitalRows.push({
      time: "",
      bt: "",
      bp: "",
      pr: "",
      rr: "",
      e: "",
      v: "",
      m: "",
      lt: "",
      rt: "",
      o2: "",
      dtx: "",
    });
  }

  const evalRows = [
    { label: "ทางเดินหายใจ", values: arr("airway") },
    { label: "การห้ามเลือด", values: arr("wound_care") },
    { label: "การให้สารน้ำ", values: arr("fluid") },
    { label: "การดามกระดูก", values: arr("splint") },
    { label: "การทำ CPR", values: arr("cpr") },
  ];

  return (
    <div className="als">
      <style>{alsCss}</style>
      <PrintButton />

      <h1>แบบบันทึกการปฏิบัติงานบริการการแพทย์ฉุกเฉินระดับสูง (ALS)</h1>

      <div className={`frame${blank ? " blank" : ""}`}>
        {s(row.scene_status) === "ไม่พบเหตุ" && (
          <div className="stamp">ไม่พบเหตุ</div>
        )}

        <div className="big-zone">
          {/* ---------- 1. หน่วยบริการ ---------- */}
          <div className="sec">
            <div className="row" style={{ marginBottom: 2 }}>
              <span className="sec-title" style={{ margin: 0 }}>
                1. หน่วยบริการ
              </span>
              <span className="fld">
                ลำดับผู้ป่วย (CN) <Line value={row.seq_no as number} w={60} />
              </span>
              <span className="fld">
                เลขที่ผู้ป่วย <Line value={s(row.op_no)} w={100} />
              </span>
            </div>
            <div className="box-table">
              <div className="box-row">
                <span className="fld">
                  ชื่อหน่วยบริการ <Line value="ER รพ.นครไทย" w={160} />
                </span>
                <span className="fld">
                  วันที่ <Line value={thaiDate(s(row.incident_date))} w={90} />
                </span>
                <span className="fld">
                  ปฏิบัติการที่ <Line value={s(row.op_no)} w={90} />
                </span>
              </div>
              <div className="box-row">
                <span className="fld">
                  เจ้าหน้าที่ผู้ให้บริการ&nbsp; 1.{" "}
                  <Line
                    value={withStaffRole(s(row.staff_provider1), roleByName)}
                    w={150}
                  />{" "}
                  รหัส <Line w={60} />
                </span>
                <span className="fld">
                  2.{" "}
                  <Line
                    value={withStaffRole(s(row.staff_provider2), roleByName)}
                    w={150}
                  />{" "}
                  รหัส <Line w={60} />
                </span>
              </div>
              <div className="box-row">
                <span className="fld">
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                  3.{" "}
                  <Line
                    value={s(row.staff_driver) ? `${s(row.staff_driver)} (พขร.)` : ""}
                    w={150}
                  />{" "}
                  รหัส <Line w={60} />
                </span>
                <span className="fld">
                  4.{" "}
                  <Line
                    value={
                      s(row.staff_helper) ? `${s(row.staff_helper)} (ผู้ช่วยเหลือ)` : ""
                    }
                    w={150}
                  />{" "}
                  รหัส <Line w={60} />
                </span>
              </div>
              <div className="box-row">
                <span className="fld">ผลการปฏิบัติงาน</span>
                <span>
                  <Box on={s(row.scene_status) === "ไม่พบเหตุ"} /> ไม่พบเหตุ
                </span>
                <span>
                  <Box on={s(row.scene_status) === "พบเหตุ"} /> พบเหตุ
                  สถานที่เกิดเหตุ <Line value={s(row.location)} w={260} />
                </span>
              </div>
            </div>
          </div>

          {/* ---------- 2. ข้อมูลเวลา ---------- */}
          <div className="sec">
            <div className="sec-title">2. ข้อมูลเวลา</div>
            <table>
              <tbody>
                <tr>
                  <th />
                  <th>รับแจ้ง</th>
                  <th>สั่งการ</th>
                  <th>ออกจากฐาน</th>
                  <th>ถึงที่เกิดเหตุ</th>
                  <th>ออกจากที่เกิดเหตุ</th>
                  <th>ถึง รพ.</th>
                  <th>ถึงฐาน</th>
                </tr>
                <tr>
                  <td>เวลา (น.)</td>
                  <td>{hm(s(row.t_received))}</td>
                  <td>{hm(s(row.t_dispatch))}</td>
                  <td>{hm(s(row.t_depart_station))}</td>
                  <td>{hm(s(row.t_arrive_scene))}</td>
                  <td>{hm(s(row.t_depart_scene))}</td>
                  <td>{hm(s(row.t_arrive_hospital))}</td>
                  <td>{hm(s(row.t_arrive_station))}</td>
                </tr>
                <tr>
                  <td>รวมเวลา (นาที)</td>
                  <td colSpan={4}>
                    Response time = {s(row.response_time_min)} นาที
                  </td>
                  <td colSpan={2}>
                    Hospital Time = {s(row.hospital_time_min)} นาที
                  </td>
                  <td className="hatch" />
                </tr>
                <tr>
                  <td>เลข กม.</td>
                  <td>-</td>
                  <td>-</td>
                  <td>{s(row.mile_out)}</td>
                  <td>{s(row.mile_scene)}</td>
                  <td>{s(row.mile_scene)}</td>
                  <td>{s(row.mile_hospital)}</td>
                  <td>{s(row.mile_station)}</td>
                </tr>
                <tr>
                  <td rowSpan={2}>ระยะทาง (กม.)</td>
                  <td colSpan={4} rowSpan={2}>
                    รวมระยะทางไป {kmBetween(mileOut, mileScene)} กม.
                  </td>
                  {/* ระบบเดิมพิมพ์ "ระยะทางกลับ" ด้วยสูตรเดียวกับ "ระยะไป รพ." (ถึงรพ. − ถึงเหตุ)
                      ซึ่งเป็นเลขผิด — ที่ถูกคือ ถึงฐาน − ถึง รพ. */}
                  <td colSpan={2}>
                    ระยะทางกลับ {kmBetween(mileHospital, mileStation)} กม.
                  </td>
                  <td className="hatch" />
                </tr>
                <tr>
                  <td colSpan={2}>
                    ระยะไป รพ. {kmBetween(mileScene, mileHospital)} กม.
                  </td>
                  <td className="hatch" />
                </tr>
              </tbody>
            </table>
          </div>

          {/* ---------- 3. ข้อมูลผู้ป่วย ---------- */}
          <div className="sec">
            <div className="sec-title">3. ข้อมูลผู้ป่วย</div>
            <div className="row">
              <span className="fld">
                คำนำหน้า/ชื่อ-สกุลผู้ป่วย{" "}
                <Line value={s(row.patient_name)} w={200} />
              </span>
              <span className="fld">
                อายุ <Line value={s(row.patient_age)} w={40} /> ปี
              </span>
              <span className="fld">
                เพศ <Box on={sex.male} /> ชาย <Box on={sex.female} /> หญิง
              </span>
              <span className="fld">
                ประกันอื่นๆ (ถ้ามี) <Box on={false} /> ประกันท่องเที่ยว ประเภท{" "}
                <Line w={70} /> &nbsp; <Box on={false} /> ผู้ประสบภัยจากรถ
              </span>
            </div>
            <div className="row">
              <span className="fld">
                <Box on={isThai} /> คนไทย เลขบัตรประชาชน/ID{" "}
                <Line value={s(row.patient_national_id)} w={150} />
              </span>
              <span className="fld">
                <Box on={isMigrant} /> แรงงานต่างด้าว ประเภท{" "}
                <Line value={isMigrant ? s(row.nationality_detail) : ""} w={90} />
              </span>
              <span className="fld">
                <Box on={isForeign} /> ชาวต่างชาติ ประเทศ{" "}
                <Line value={isForeign ? s(row.nationality_detail) : ""} w={90} />{" "}
                เลขที่หนังสือเดินทาง <Line w={100} />
              </span>
            </div>
            <div className="row">
              <span className="fld">
                สิทธิการรักษา{" "}
                <CheckList
                  options={[
                    "บัตรทอง",
                    "ข้าราชการ",
                    "ประกันสังคม",
                    "แรงงานต่างด้าวขึ้นทะเบียน",
                    "ไม่มีหลักประกัน",
                  ]}
                  chosen={[s(row.insurance_right)]}
                />
              </span>
            </div>
            <div className="row">
              <span className="fld">
                HN <Line value={s(row.patient_hn)} w={100} />
              </span>
              <span className="fld">
                ที่อยู่ <Line value={s(row.address_subdistrict)} w={260} />
              </span>
            </div>
            <div className="row">
              <span className="fld">
                อาการ <Line value={s(row.symptoms)} w={400} />
              </span>
            </div>
            <div className="row">
              <span className="fld">
                Dx <Line value={s(row.dx)} w={400} />
              </span>
            </div>

            <table>
              <tbody>
                <tr>
                  <th rowSpan={2}>Time</th>
                  <th colSpan={4}>Vital Signs</th>
                  <th colSpan={3}>Neuro Signs</th>
                  <th colSpan={4}>Pupils</th>
                  <th rowSpan={2}>O2 Sat</th>
                  <th rowSpan={2}>DTX</th>
                </tr>
                <tr>
                  <th>T</th>
                  <th>BP</th>
                  <th>PR</th>
                  <th>RR</th>
                  <th>E</th>
                  <th>V</th>
                  <th>M</th>
                  <th>Rt</th>
                  <th>RTL</th>
                  <th>Lt</th>
                  <th>RTL</th>
                </tr>
                {vitalRows.map((v, i) => (
                  <tr key={i}>
                    <td>{v.time || " "}</td>
                    <td>{v.bt}</td>
                    <td>{v.bp}</td>
                    <td>{v.pr}</td>
                    <td>{v.rr}</td>
                    <td>{v.e}</td>
                    <td>{v.v}</td>
                    <td>{v.m}</td>
                    <td>{v.rt}</td>
                    <td>Y/N</td>
                    <td>{v.lt}</td>
                    <td>Y/N</td>
                    <td>{v.o2}</td>
                    <td>{v.dtx}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="subrow">
              <span className="lbl">ประเภทเหตุการณ์</span>
              <span>
                {s(row.trauma_type)}
                {s(row.incident_detail) ? ` — ${s(row.incident_detail)}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ---------- Trauma / Non-Trauma / Treatment ---------- */}
        <div className="grp">
          <div className="grp-label">Trauma</div>
          <div className="grp-body">
            {(["wound", "deform", "bleed", "organ"] as const).map((key) => (
              <div className="subrow" key={key}>
                <span className="lbl">{MULTI_GROUPS[key].label}</span>
                <span>
                  <CheckList options={MULTI_GROUPS[key].options} chosen={arr(key)} />
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="grp">
          <div className="grp-label">Non trauma</div>
          <div className="grp-body">
            {(["medical", "obgyn", "peds", "surgical", "other_nt"] as const).map(
              (key) => (
                <div className="subrow" key={key}>
                  <span className="lbl">{MULTI_GROUPS[key].label}</span>
                  <span>
                    <CheckList
                      options={MULTI_GROUPS[key].options}
                      chosen={arr(key)}
                    />
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="grp">
          <div className="grp-label">Treatment</div>
          <div className="grp-body">
            {(["airway", "wound_care", "fluid", "splint", "cpr"] as const).map(
              (key) => (
                <div className="subrow" key={key}>
                  <span className="lbl">{MULTI_GROUPS[key].label}</span>
                  <span>
                    <CheckList
                      options={MULTI_GROUPS[key].options}
                      chosen={arr(key)}
                    />
                  </span>
                </div>
              ),
            )}
          </div>
        </div>

        <div className="sec">
          <div className="row">
            <span className="fld">
              ยา (วิธีใช้ และขนาด ให้ทาง){" "}
              <Line value={s(row.treatment)} w={500} />
            </span>
          </div>

          <div className="row">
            <span className="fld">
              ผลการดูแลรักษาขั้นต้น{" "}
              {s(row.outcome) ? `(ผลการรักษาระบบ: ${s(row.outcome)})` : ""}
            </span>
          </div>
          <div className="chklist">
            <CheckList
              options={[
                "ไม่ยอมให้รักษา",
                "ทุเลา",
                "คงเดิม/คงที่",
                "ทรุดหนัก",
                "เสียชีวิต ณ จุดเกิดเหตุ",
                "เสียชีวิตขณะนำส่ง",
              ]}
              chosen={[s(row.initial_care_result)]}
            />
          </div>

          {isDeathAtScene && (
            <div className="subrow" style={{ alignItems: "flex-end" }}>
              <span className="lbl">ลายเซ็นญาติรับทราบ</span>
              {attachments.death_signature ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="sig-img"
                  src={attachments.death_signature}
                  alt="ลายเซ็นญาติ"
                />
              ) : (
                <span className="line" style={{ minWidth: 180, height: 16 }}>
                  &nbsp;
                </span>
              )}
              <span style={{ marginLeft: 14 }}>
                ชื่อญาติ <Line value={s(row.death_signer_name)} w={180} />
              </span>
            </div>
          )}

          <div className="row">
            <span>
              <Box on={row.palliative_care === true} /> รักษาประคับประคองตามอาการ
              (Palliative/Comfort Care)
            </span>
          </div>
          {row.palliative_care === true && (
            <div className="subrow" style={{ alignItems: "flex-end" }}>
              <span className="lbl">ลายเซ็นญาติรับทราบ</span>
              {attachments.palliative_signature ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="sig-img"
                  src={attachments.palliative_signature}
                  alt="ลายเซ็นญาติ"
                />
              ) : (
                <span className="line" style={{ minWidth: 180, height: 16 }}>
                  &nbsp;
                </span>
              )}
              <span style={{ marginLeft: 14 }}>
                ชื่อญาติ <Line value={s(row.palliative_signer_name)} w={180} />
              </span>
            </div>
          )}

          <div className="row">
            <span className="fld">ระดับการคัดแยก (RC Code)</span>
          </div>
          <div className="chklist">
            <span>
              <Box on={rc("สีแดง")} /> แดง (วิกฤต)
            </span>
            <span>
              <Box on={rc("สีเหลือง")} /> เหลือง (เร่งด่วน)
            </span>
            <span>
              <Box on={rc("สีเขียว")} /> เขียว (ไม่รุนแรง)
            </span>
            <span>
              <Box on={rc("สีขาว")} /> ขาว (ทั่วไป)
            </span>
            <span>
              <Box on={rc("สีดำ")} /> ดำ (รับบริการสาธารณสุขอื่น)
              {isDeathAtScene ? " NO Tube NO CPR ,NR" : ""}
            </span>
          </div>
        </div>

        {/* ---------- 4. เกณฑ์การตัดสินใจส่งโรงพยาบาล ---------- */}
        <div className="sec">
          <div className="sec-title">
            4. เกณฑ์การตัดสินใจส่งโรงพยาบาล (โดยหัวหน้าทีมและ/ผ่านการเห็นชอบของศูนย์ฯ)
          </div>
          <div className="row">
            <span className="fld">
              นำส่งโรงพยาบาล{" "}
              <Line value={s(row.refer_hospital) || "รพ.นครไทย"} w={260} />
            </span>
            <span>
              <Box on /> รพ.รัฐ
            </span>
            <span>
              <Box on={false} /> รพ.เอกชน
            </span>
          </div>
          <div className="chklist">
            เหตุผล <Box on /> เหมาะสม/สามารถรักษาได้ &nbsp; <Box on={false} /> อยู่ไกล
            &nbsp; <Box on={false} /> มีหลักประกัน &nbsp; <Box on={false} />{" "}
            เป็นผู้ป่วยเก่า &nbsp; <Box on={false} /> เป็นความประสงค์
            (เลือกได้มากกว่า 1 ข้อ)
          </div>
          <div className="row">
            <span className="fld">
              ผู้สรุปรายงาน <Line value={s(row.report_summarizer)} w={140} /> รหัส{" "}
              <Line w={90} />
            </span>
          </div>
        </div>

        {/* ---------- 5. การประเมิน/รับรองการนำส่ง ---------- */}
        <div className="sec">
          <div className="sec-title">
            5. การประเมิน/รับรองการนำส่ง (โดยแพทย์ พยาบาล
            ประจำโรงพยาบาลที่รับดูแลต่อ) เพิ่ม RC code
          </div>
          <div className="row">
            <span className="fld">
              HN <Line value={s(row.patient_hn)} w={100} />
            </span>
            <span className="fld">
              การวินิจฉัยโรค <Line value={s(row.dx)} w={300} />
            </span>
          </div>
          <div className="chklist">
            ระดับการคัดแยก (ER Triage) <Box on={rc("สีแดง")} /> แดง (วิกฤต) L1,L2
            &nbsp; <Box on={rc("สีเหลือง")} /> เหลือง (เร่งด่วน) L3 &nbsp;{" "}
            <Box on={rc("สีเขียว")} /> เขียว (ไม่รุนแรง) L4 &nbsp;{" "}
            <Box on={rc("สีขาว")} /> ขาว (ทั่วไป) L5 &nbsp; <Box on={rc("สีดำ")} />{" "}
            ดำ (รับบริการสาธารณสุขอื่น) ไม่ใช่ผู้ป่วย
            {isDeathAtScene ? " NO Tube NO CPR ,NR" : ""}
          </div>
          {evalRows.map((item) => {
            const status = evaluateTreatment(item.values);
            return (
              <div className="chklist" key={item.label}>
                <span className="lbl" style={{ minWidth: 110, fontWeight: 600 }}>
                  {item.label}
                </span>
                <Box on={status === "none"} /> ไม่จำเป็น &nbsp; <Box on={false} />{" "}
                ไม่ได้ทำ &nbsp; <Box on={status === "done"} /> ทำและเหมาะสม &nbsp;{" "}
                <Box on={false} /> ทำแต่ไม่เหมาะสม ระบุ <Line w={150} />
              </div>
            );
          })}
          <div className="row">
            <span className="fld">
              ชื่อผู้ประเมิน <Line value={s(row.evaluator_name)} w={200} />
            </span>
            <span className="fld">
              ตำแหน่ง <Box on={false} /> แพทย์ <Box on /> พยาบาล
            </span>
          </div>
        </div>

        {/* ---------- 6. ผลการรักษาที่/ในโรงพยาบาล ---------- */}
        <div className="sec">
          <div className="sec-title">
            6. ผลการรักษาที่/ในโรงพยาบาล (ติดตามในวันสิ้นเดือน)
          </div>
          <div className="row">
            <span className="fld">Admitted</span>
            <span>
              <Box on={s(row.outcome) === "Admit"} /> Yes
            </span>
            <span>
              <Box on={false} /> No
            </span>
          </div>
          <div className="chklist">
            <Box on={s(row.outcome) === "D/C"} /> ทุเลา &nbsp;{" "}
            <Box on={s(row.outcome) === "Refer"} /> รักษาต่อที่อื่น &nbsp;{" "}
            <Box on={false} /> ยังรักษาใน รพ. &nbsp;{" "}
            <Box on={s(row.outcome) === "Death"} /> เสียชีวิต ใน รพ. &nbsp;{" "}
            <Box on={false} /> ปฏิเสธการรักษา/หนีกลับ &nbsp; <Box on={false} />{" "}
            กลับไปตายบ้าน &nbsp; <Box on={false} /> ตามแล้วไม่ทราบผล
          </div>
        </div>
      </div>

      <div className="footnote">
        ส่งแบบบันทึกกลับมาที่สำนักงานระบบบริการการแพทย์ฉุกเฉินประจำจังหวัดก่อนวันสิ้นเดือนนั้น
      </div>
      <div className="sysnote">
        {blank
          ? "แบบฟอร์มเปล่า — พิมพ์เพื่อกรอกข้อมูลด้วยมือ"
          : `บันทึกโดย ${recordedBy} — ข้อมูลตัวหนาเติมจากระบบ NKT Rescue อัตโนมัติ ส่วนที่เหลือ (รายละเอียดการรักษาแบบละเอียด, ส่วนที่ 5 และ 6) ให้เจ้าหน้าที่/โรงพยาบาลกรอกเพิ่มด้วยมือหลังพิมพ์`}
      </div>
    </div>
  );
}
