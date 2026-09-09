import { db } from "@/lib/supabase/admin";
import { ATTACHMENT_BUCKET } from "@/lib/storage";
import {
  INCIDENT_TYPES,
  INITIAL_CARE_RESULTS,
  INSURANCE_RIGHTS,
  NATIONALITIES,
  OUTCOMES,
  RECEIVED_FROM,
  REFER_SEVERITIES,
  REFER_TEAMS,
  SCENE_STATUSES,
  SEVERITIES,
  SHIFTS,
  TRAUMA_TYPES,
} from "@/lib/domain/options";

/**
 * ย้ายข้อมูลจาก Google Sheet ของระบบ GAS เดิมเข้า schema v2
 *
 * ดึงผ่าน gviz (อ่านอย่างเดียว ไม่ต้องมี API key) แล้ว map ตามลำดับคอลัมน์
 * ที่ถอดไว้ใน docs/legacy-backend-spec.md — ชีตไม่มีหัวคอลัมน์ที่เชื่อถือได้
 * (gviz คืนหัวตารางไม่ครบเมื่อคอลัมน์เป็นชนิดวันที่/ตัวเลข) จึงอ้างด้วย index
 */

type Row = string[];

function parseCsv(text: string): Row[] {
  const rows: Row[] = [];
  let row: string[] = [];
  let cur = "";
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else quoted = false;
      } else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cur);
      cur = "";
    } else if (c === "\n") {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
    } else if (c !== "\r") cur += c;
  }
  if (cur !== "" || row.length) {
    row.push(cur);
    rows.push(row);
  }
  return rows;
}

async function fetchTab(sheetId: string, tab: string): Promise<Row[]> {
  const url =
    `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq` +
    `?tqx=out:csv&headers=0&sheet=${encodeURIComponent(tab)}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`อ่านชีต ${tab} ไม่ได้ (HTTP ${res.status})`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) {
    throw new Error(
      `ชีต ${tab} ตอบกลับเป็นหน้าเว็บ ไม่ใช่ข้อมูล — ต้องตั้งค่าแชร์เป็น "ทุกคนที่มีลิงก์ ดูได้" ก่อน`,
    );
  }
  return parseCsv(text);
}

export async function probeSheet(sheetId: string, tabs: string[]) {
  const result: Record<string, unknown> = {};
  for (const tab of tabs) {
    try {
      const rows = await fetchTab(sheetId, tab);
      result[tab] = {
        ok: true,
        rows: rows.length - 1,
        columns: Math.max(...rows.map((r) => r.length)),
      };
    } catch (e) {
      result[tab] = {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }
  return result;
}

/* ---------------------------------------------------------------- helpers */

const txt = (v: string | undefined) => {
  const s = (v ?? "").trim();
  return s === "" ? null : s;
};

const int = (v: string | undefined) => {
  const n = Number.parseInt((v ?? "").trim(), 10);
  return Number.isNaN(n) ? null : n;
};

const num = (v: string | undefined) => {
  const n = Number.parseFloat((v ?? "").trim());
  return Number.isNaN(n) ? null : n;
};

/** "9:30" -> "09:30" · ค่าที่ไม่ใช่เวลาให้ทิ้ง */
const time = (v: string | undefined) => {
  const m = /^(\d{1,2}):(\d{2})/.exec((v ?? "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${m[2]}`;
};

const list = (v: string | undefined): string[] =>
  (v ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** ค่าที่ไม่ตรงกับตัวเลือกที่ schema ยอมรับจะถูกทิ้งและรายงานกลับ */
function oneOf(
  value: string | undefined,
  allowed: readonly string[],
  field: string,
  dropped: string[],
): string | null {
  const v = txt(value);
  if (v === null) return null;
  if (allowed.includes(v)) return v;
  dropped.push(`${field}="${v}"`);
  return null;
}

/**
 * GCS นอกพิสัย (E 1-4, V 1-5, M 1-6) มาจากการกรอกผิดในระบบเดิม
 * ทิ้งเฉพาะค่านั้นแล้วบันทึกไว้ในรายงาน ดีกว่าทิ้งทั้งเคส
 */
function gcs(
  v: string | undefined,
  max: number,
  field: string,
  dropped: string[],
): number | null {
  const n = int(v);
  if (n === null) return null;
  if (n < 1 || n > max) {
    dropped.push(`${field}=${n}`);
    return null;
  }
  return n;
}

const isoDate = (v: string | undefined) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec((v ?? "").trim());
  return m ? m[0] : null;
};

/** "2026-09-01 2:12:02" -> ISO ที่ Postgres รับได้ (ถือว่าเป็นเวลาไทย) */
function timestamp(v: string | undefined): string | null {
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})/.exec(
    (v ?? "").trim(),
  );
  if (!m) return null;
  return `${m[1]}T${m[2].padStart(2, "0")}:${m[3]}:${m[4]}+07:00`;
}

async function uploadDataUrl(
  caseKey: string,
  name: string,
  value: string | undefined,
): Promise<string | null> {
  const v = (value ?? "").trim();
  if (!v.startsWith("data:")) return null;

  const m = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]*)$/.exec(v);
  if (!m) return null;

  const ext = m[1].includes("png") ? "png" : "jpg";
  const path = `legacy/${caseKey}/${name}.${ext}`;
  const { error } = await db()
    .storage.from(ATTACHMENT_BUCKET)
    .upload(path, Buffer.from(m[2], "base64"), {
      contentType: m[1],
      upsert: true,
    });
  if (error) throw new Error(`อัปโหลด ${name} ไม่สำเร็จ: ${error.message}`);
  return path;
}

/** รูปถ่ายเดิมอยู่บน Google Drive (แชร์สาธารณะ) — ย้ายเข้า bucket ส่วนตัว */
async function moveDriveImage(
  caseKey: string,
  url: string | undefined,
): Promise<string | null> {
  const u = (url ?? "").trim();
  if (!u.startsWith("http")) return null;

  const res = await fetch(u, { cache: "no-store" });
  if (!res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  if (!contentType.startsWith("image/")) return null;

  const path = `legacy/${caseKey}/death-photo.${contentType.includes("png") ? "png" : "jpg"}`;
  const { error } = await db()
    .storage.from(ATTACHMENT_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) return null;
  return path;
}

/**
 * ล้างข้อมูลเคสทั้งหมดก่อนนำเข้าใหม่ — ใช้เฉพาะตอนย้ายระบบ
 * ต้นฉบับยังอยู่ใน Google Sheet ดึงกลับมาได้เสมอ
 * (ems_vitals ถูกลบตามด้วย on delete cascade)
 */
export async function resetCases() {
  const ems = await db().from("ems_cases").delete().not("id", "is", null);
  if (ems.error) throw new Error(`ล้าง ems_cases ไม่สำเร็จ: ${ems.error.message}`);

  const refer = await db().from("refer_cases").delete().not("id", "is", null);
  if (refer.error)
    throw new Error(`ล้าง refer_cases ไม่สำเร็จ: ${refer.error.message}`);

  // ไฟล์แนบที่นำเข้ามารอบก่อน — ลบทิ้งด้วย ไม่งั้นค้างเป็นขยะใน bucket
  const { data: folders } = await db()
    .storage.from(ATTACHMENT_BUCKET)
    .list("legacy");
  for (const folder of folders ?? []) {
    const { data: files } = await db()
      .storage.from(ATTACHMENT_BUCKET)
      .list(`legacy/${folder.name}`);
    const paths = (files ?? []).map((f) => `legacy/${folder.name}/${f.name}`);
    if (paths.length) {
      await db().storage.from(ATTACHMENT_BUCKET).remove(paths);
    }
  }
}

/* ------------------------------------------------------------------ import */

export async function importLegacySheet(
  sheetId: string,
  tabs: string[],
  dryRun: boolean,
) {
  const { data: accountRows } = await db().from("accounts").select("id, code");
  const accountByCode = new Map(
    ((accountRows ?? []) as { id: string; code: string }[]).map((a) => [
      a.code,
      a.id,
    ]),
  );

  const report: Record<string, unknown> = { dryRun, tabs: {} };
  const tabReports = report.tabs as Record<string, unknown>;

  for (const tab of tabs) {
    tabReports[tab] = tab.startsWith("REFER_")
      ? await importReferTab(sheetId, tab, accountByCode, dryRun)
      : await importEmsTab(sheetId, tab, accountByCode, dryRun);
  }
  return report;
}

async function importEmsTab(
  sheetId: string,
  tab: string,
  accountByCode: Map<string, string>,
  dryRun: boolean,
) {
  const all = await fetchTab(sheetId, tab);
  const header = all[0] ?? [];
  const rows = all.slice(1);
  const notes: string[] = [];
  let imported = 0;
  let skipped = 0;

  /**
   * ชีตรุ่นเก่า (50 คอลัมน์) ยังไม่มีช่อง DX — ทุกคอลัมน์ตั้งแต่ BP เป็นต้นไป
   * จึงเลื่อนซ้ายไป 1 ช่อง เทียบกับรุ่นปัจจุบัน (80 คอลัมน์)
   */
  const legacyLayout = (header[34] ?? "").trim() !== "DX";
  if (legacyLayout) {
    notes.push("ชีตนี้เป็นรุ่นเก่าที่ยังไม่มีช่อง DX — ปรับตำแหน่งคอลัมน์ให้แล้ว");
  }

  // เลข "เหตุที่" ของบางแถวว่างไว้ — เติมให้ต่อจากเลขสูงสุดของวันนั้น
  // นับรวมเคสที่มีอยู่ในฐานข้อมูลแล้วด้วย ไม่งั้นชนกับ unique (วันที่, ลำดับ)
  const usedSeq = new Map<string, Set<number>>();
  const { data: existing } = await db()
    .from("ems_cases")
    .select("incident_date, seq_no");
  for (const e of (existing ?? []) as { incident_date: string; seq_no: number }[]) {
    const set = usedSeq.get(e.incident_date) ?? new Set<number>();
    set.add(e.seq_no);
    usedSeq.set(e.incident_date, set);
  }
  const takeSeq = (date: string, wanted: number | null) => {
    const used = usedSeq.get(date) ?? new Set<number>();
    usedSeq.set(date, used);
    let seq = wanted ?? 0;
    if (seq <= 0 || used.has(seq)) {
      seq = Math.max(0, ...used) + 1;
    }
    used.add(seq);
    return seq;
  };

  for (const [i, r] of rows.entries()) {
    const line = i + 2; // แถวจริงในชีต (นับหัวตาราง)
    const date = isoDate(r[1]);
    if (!date) {
      skipped++;
      notes.push(`แถว ${line}: ไม่มีวันที่ ข้ามไป`);
      continue;
    }

    const dropped: string[] = [];
    const caseKey = `${tab}-${line}`;
    /**
     * อ่านคอลัมน์โดยชดเชยตำแหน่งของชีตรุ่นเก่า
     * ช่อง DX (34) ไม่มีอยู่จริงในรุ่นเก่า ต้องคืนค่าว่าง ไม่ใช่เลื่อนไปหยิบ
     * ช่อง "อาการ" (33) มาแทน · ตั้งแต่ 35 ขึ้นไปจึงเลื่อนซ้าย 1 ช่อง
     */
    const c = (i: number) => {
      if (!legacyLayout) return r[i];
      if (i === 34) return undefined;
      return i > 34 ? r[i - 1] : r[i];
    };

    const record: Record<string, unknown> = {
      incident_date: date,
      seq_no: takeSeq(date, int(r[3])),
      op_no: txt(r[4]),
      shift: oneOf(r[2], SHIFTS, "เวร", dropped),
      staff_provider1: txt(r[5]),
      staff_provider2: txt(r[6]),
      staff_driver: txt(r[7]),
      staff_helper: txt(c(50)),

      received_from: oneOf(r[8], RECEIVED_FROM, "รับแจ้งจาก", dropped),
      incident_type: oneOf(r[9], INCIDENT_TYPES, "ประเภทเหตุการณ์", dropped),
      incident_detail: txt(r[10]),
      location: txt(r[11]),
      caller_phone: txt(r[12]),
      severity: oneOf(
        r[13],
        SEVERITIES.map((s) => s.value),
        "ระดับความรุนแรง",
        dropped,
      ),
      trauma_type: oneOf(r[14], TRAUMA_TYPES, "ประเภท", dropped),
      scene_status: oneOf(r[15], SCENE_STATUSES, "พบเหตุ", dropped),

      t_received: time(r[16]),
      t_dispatch: time(r[17]),
      t_depart_station: time(r[18]),
      t_arrive_scene: time(r[19]),
      t_depart_scene: time(r[20]),
      t_arrive_hospital: time(r[21]),
      t_arrive_station: time(r[22]),

      mile_out: num(r[23]),
      mile_scene: num(r[24]),
      mile_hospital: num(r[25]),
      mile_station: num(r[26]),

      patient_name: txt(r[28]),
      patient_age: int(r[29]),
      patient_national_id: txt(r[30]),
      patient_hn: txt(r[31]),
      address_subdistrict: txt(r[32]),
      symptoms: txt(r[33]),
      dx: txt(c(34)),

      bp: txt(c(35)),
      pr: int(c(36)),
      rr: int(c(37)),
      bt: num(c(38)),
      o2sat: int(c(39)),
      gcs_e: gcs(c(40), 4, "GCS E", dropped),
      gcs_v: gcs(c(41), 5, "GCS V", dropped),
      gcs_m: gcs(c(42), 6, "GCS M", dropped),
      pupil_l: txt(c(44)),
      pupil_r: txt(c(79)),
      dtx: int(c(45)),
      treatment: txt(c(46)),

      wound: list(c(51)),
      deform: list(c(52)),
      bleed: list(c(53)),
      organ: list(c(54)),
      medical: list(c(55)),
      obgyn: list(c(56)),
      peds: list(c(57)),
      surgical: list(c(58)),
      other_nt: list(c(59)),
      airway: list(c(60)),
      wound_care: list(c(61)),
      fluid: list(c(62)),
      splint: list(c(63)),
      cpr: list(c(64)),

      initial_care_result: oneOf(
        c(65),
        INITIAL_CARE_RESULTS,
        "ผลการดูแลรักษาขั้นต้น",
        dropped,
      ),
      death_signer_name: txt(c(67)),
      nationality: oneOf(c(69), NATIONALITIES, "สัญชาติ", dropped),
      nationality_detail: txt(c(70)),
      insurance_right: oneOf(c(71), INSURANCE_RIGHTS, "สิทธิการรักษา", dropped),

      report_summarizer: txt(c(73)),
      evaluator_name: txt(c(74)),
      palliative_care: (c(75) ?? "").trim() === "ใช่",
      palliative_signer_name: txt(c(77)),

      outcome: oneOf(c(47), OUTCOMES, "ผลการรักษา", dropped),
      refer_hospital: txt(c(48)),

      created_by: accountByCode.get((c(49) ?? "").trim()) ?? null,
      created_at: timestamp(c(78)) ?? timestamp(r[0]),
    };

    // ชุดสัญญาณชีพประเมินซ้ำ เก็บเป็น JSON ก้อนเดียวในชีต
    let vitals: Record<string, string>[] = [];
    try {
      const parsed = JSON.parse(txt(c(72)) ?? "[]");
      if (Array.isArray(parsed)) vitals = parsed;
    } catch {
      notes.push(`แถว ${line}: อ่านชุดสัญญาณชีพเพิ่มเติมไม่ได้`);
    }

    if (dropped.length) {
      notes.push(`แถว ${line}: ค่าไม่ตรงตัวเลือก ทิ้ง ${dropped.join(", ")}`);
    }

    if (dryRun) {
      imported++;
      continue;
    }

    const [deathSignature, palliativeSignature, deathPhoto] = await Promise.all([
      uploadDataUrl(caseKey, "death-signature", c(66)),
      uploadDataUrl(caseKey, "palliative-signature", c(76)),
      moveDriveImage(caseKey, c(68)),
    ]);

    const { data: inserted, error } = await db()
      .from("ems_cases")
      .insert({
        ...record,
        death_signature_path: deathSignature,
        palliative_signature_path: palliativeSignature,
        death_photo_path: deathPhoto,
      })
      .select("id")
      .single();

    if (error) {
      skipped++;
      notes.push(`แถว ${line}: บันทึกไม่สำเร็จ — ${error.message}`);
      continue;
    }

    if (vitals.length) {
      await db()
        .from("ems_vitals")
        .insert(
          vitals.map((v, idx) => ({
            case_id: inserted.id,
            sort_order: idx,
            measured_at: time(v.time),
            bp: txt(v.bp),
            pr: int(v.pr),
            rr: int(v.rr),
            bt: num(v.bt),
            o2sat: int(v.o2sat),
            gcs_e: int(v.gcsE),
            gcs_v: int(v.gcsV),
            gcs_m: int(v.gcsM),
            pupil_l: txt(v.pupilL),
            pupil_r: txt(v.pupilR),
            dtx: int(v.dtx),
          })),
        );
    }
    imported++;
  }

  return { imported, skipped, notes };
}

async function importReferTab(
  sheetId: string,
  tab: string,
  accountByCode: Map<string, string>,
  dryRun: boolean,
) {
  const rows = (await fetchTab(sheetId, tab)).slice(1);
  const notes: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const [i, r] of rows.entries()) {
    const line = i + 2;
    const date = isoDate(r[1]);
    if (!date) {
      skipped++;
      continue;
    }

    const dropped: string[] = [];
    const record = {
      refer_date: date,
      patient_name: txt(r[2]),
      patient_hn: txt(r[3]),
      patient_age: int(r[4]),
      dx: txt(r[5]),
      refer_hospital: txt(r[6]),
      team: oneOf(r[7], REFER_TEAMS, "ทีมนำส่ง", dropped),
      severity: oneOf(
        r[8],
        REFER_SEVERITIES.map((s) => s.value),
        "ระดับความรุนแรง",
        dropped,
      ),
      trauma_type: oneOf(r[10], TRAUMA_TYPES, "ประเภท", dropped),
      created_by: accountByCode.get((r[9] ?? "").trim()) ?? null,
      created_at: timestamp(r[0]),
    };

    if (dropped.length) {
      notes.push(`แถว ${line}: ค่าไม่ตรงตัวเลือก ทิ้ง ${dropped.join(", ")}`);
    }
    if (dryRun) {
      imported++;
      continue;
    }

    const { error } = await db().from("refer_cases").insert(record);
    if (error) {
      skipped++;
      notes.push(`แถว ${line}: บันทึกไม่สำเร็จ — ${error.message}`);
      continue;
    }
    imported++;
  }

  return { imported, skipped, notes };
}
