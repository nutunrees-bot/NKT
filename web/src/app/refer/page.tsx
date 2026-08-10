import { ArrowLeftRight } from "lucide-react";

export default function ReferPage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:py-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-(--text-primary) sm:text-xl">
          Refer In / Out
        </h2>
        <p className="text-xs text-(--text-secondary)">
          ทะเบียนส่งต่อผู้ป่วย ชาติตระการ ↔ รพร.นครไทย ↔ รพ.พุทธชินราช
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--border-hairline) bg-(--surface-1) py-20 text-center">
        <ArrowLeftRight className="text-(--series-1)" size={32} />
        <p className="text-sm font-semibold text-(--text-primary)">
          ระบบ Refer In / Out กำลังอยู่ระหว่างพัฒนา
        </p>
        <p className="max-w-md text-xs text-(--text-muted)">
          จะมีฟอร์มบันทึกผู้ป่วย Refer In/Out พร้อม dashboard สรุปจำนวน
          Refer ตามเหตุผล/สาขา/ผลการรักษา — ต่อจากหน้า EMS Command Center นี้
        </p>
      </div>
    </div>
  );
}
