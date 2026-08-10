import { ClipboardCheck } from "lucide-react";

export default function TriagePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-4 sm:px-6 lg:py-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-(--text-primary) sm:text-xl">
          Triage Summary
        </h2>
        <p className="text-xs text-(--text-secondary)">
          สรุปความถูกต้องของการคัดกรอง (แดง/ชมพู/เหลือง/เขียว/ขาว) รายเดือน
        </p>
      </div>
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-(--border-hairline) bg-(--surface-1) py-20 text-center">
        <ClipboardCheck className="text-(--series-3)" size={32} />
        <p className="text-sm font-semibold text-(--text-primary)">
          ระบบ Triage Summary กำลังอยู่ระหว่างพัฒนา
        </p>
        <p className="max-w-md text-xs text-(--text-muted)">
          จะมีฟอร์มบันทึก under/over triage รายสี พร้อม dashboard
          สรุปความแม่นยำรายเดือน — ต่อจากหน้า EMS Command Center นี้
        </p>
      </div>
    </div>
  );
}
