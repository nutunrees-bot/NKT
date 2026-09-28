import Link from "next/link";

/**
 * ชิ้นส่วนหน้าตาแบบแอปมือถือที่ใช้ร่วมกันทุกแท็บ
 * (หัวเรื่องใหญ่ + คำอธิบายเล็ก, ชิปกรอง, การ์ดเคสขอบสีตามระดับความรุนแรง)
 */

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-[24px] leading-tight font-bold text-(--ink)">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] text-(--muted)">{subtitle}</p>
        )}
      </div>
      {right}
    </div>
  );
}

export function Card({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl bg-(--card) shadow-(--card-shadow) ${className}`}
    >
      {children}
    </section>
  );
}

export type ChipItem = {
  label: string;
  count?: number;
  href: string;
  active: boolean;
};

/** ชิปกรองเลื่อนแนวนอน — เป็นลิงก์ธรรมดา ตัวกรองอยู่ใน URL */
export function FilterChips({ items }: { items: ChipItem[] }) {
  return (
    <div className="no-scrollbar -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
      {items.map((c) => (
        <Link
          key={c.label}
          href={c.href}
          scroll={false}
          className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition ${
            c.active
              ? "bg-(--accent) text-white shadow-[0_2px_8px_rgba(211,47,47,.3)]"
              : "border border-(--line) bg-white text-(--ink)"
          }`}
        >
          {c.label}
          {c.count !== undefined && (
            <span className={c.active ? "ml-1.5 opacity-90" : "ml-1.5 text-(--muted)"}>
              {c.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}

/** สีขอบซ้ายการ์ด/จุดสี ตามระดับความรุนแรง — ใช้ได้ทั้งค่าแบบ EMS และ REFER */
export function severityColor(sev: string | null | undefined): string {
  if (!sev) return "#d1d5db";
  if (sev.includes("แดง")) return "var(--sev-red)";
  if (sev.includes("เหลือง")) return "var(--sev-yellow)";
  if (sev.includes("เขียว")) return "var(--sev-green)";
  if (sev.includes("ดำ")) return "var(--sev-black)";
  return "#cbd5e1"; // สีขาว / ไม่เร่งด่วน (ปกติ)
}

/** ชื่อสั้นของระดับ ไว้ใส่ในป้ายเล็ก */
export function severityShort(sev: string | null | undefined): string {
  if (!sev) return "";
  const m = /สี(แดง|เหลือง|เขียว|ขาว|ดำ)/.exec(sev);
  if (m) return `สี${m[1]}`;
  if (sev.includes("ปกติ")) return "ไม่เร่งด่วน";
  return sev;
}

export function Tag({
  children,
  tone = "grey",
}: {
  children: React.ReactNode;
  tone?: "grey" | "red" | "blue" | "green" | "amber";
}) {
  const tones = {
    grey: "bg-[#f1f2f4] text-[#4b5563]",
    red: "bg-(--accent-soft) text-(--accent-dark)",
    blue: "bg-[#e8f1fb] text-[#1d5f99]",
    green: "bg-[#e8f5ea] text-[#2e7d32]",
    amber: "bg-[#fff4d6] text-[#8a5a00]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * การ์ดเคส — ขอบซ้ายเป็นสีระดับความรุนแรง, ตัวเลขใหญ่ด้านขวา,
 * แถวปุ่มท้ายการ์ดแบ่งด้วยเส้นคั่น
 */
export function CaseCard({
  sevColor,
  title,
  meta,
  tags,
  big,
  bigLabel,
  corner,
  actions,
}: {
  sevColor: string;
  title: React.ReactNode;
  meta?: React.ReactNode;
  tags?: React.ReactNode;
  big?: React.ReactNode;
  bigLabel?: string;
  /** มุมขวาบนเล็กๆ (เช่น ปุ่มลบ) */
  corner?: React.ReactNode;
  actions: React.ReactNode[];
}) {
  return (
    <li
      className="overflow-hidden rounded-2xl border-l-[5px] bg-(--card) shadow-(--card-shadow)"
      style={{ borderLeftColor: sevColor }}
    >
      <div className="flex gap-3 px-4 pt-3.5 pb-3">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15.5px] font-bold text-(--ink)">{title}</div>
          {meta && (
            <div className="mt-0.5 truncate text-[12.5px] text-(--muted)">{meta}</div>
          )}
          {tags && <div className="mt-2 flex flex-wrap gap-1.5">{tags}</div>}
        </div>
        {(big !== undefined || corner) && (
          <div className="flex shrink-0 flex-col items-end justify-between gap-1">
            {corner}
            {big !== undefined && (
              <div className="text-right">
                <div className="text-[26px] leading-none font-bold text-(--ink)">
                  {big}
                </div>
                {bigLabel && (
                  <div className="mt-0.5 text-[11px] text-(--muted)">{bigLabel}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex divide-x divide-(--line) border-t border-(--line) text-(--ink)">
        {actions.map((a, i) => (
          <div key={i} className="flex flex-1">
            {a}
          </div>
        ))}
      </div>
    </li>
  );
}

/** ปุ่ม/ลิงก์ในแถวล่างของการ์ด */
export const cardActionClass =
  "flex flex-1 items-center justify-center gap-1.5 py-2.5 text-[13px] font-semibold active:bg-(--page-bg)";
