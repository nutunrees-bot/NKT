import type { LucideIcon } from "lucide-react";

type KpiCardProps = {
  label: string;
  value: number;
  sublabel: string;
  icon: LucideIcon;
  accent: string;
};

export default function KpiCard({
  label,
  value,
  sublabel,
  icon: Icon,
  accent,
}: KpiCardProps) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-(--border-hairline) bg-(--surface-1) p-4 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-medium text-(--text-secondary)">{label}</p>
        <p
          className="mt-1 text-2xl font-bold tabular-nums sm:text-3xl"
          style={{ color: accent }}
        >
          {value.toLocaleString("th-TH")}
        </p>
        <p className="mt-1 truncate text-xs text-(--text-muted)">{sublabel}</p>
      </div>
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `${accent}1a`, color: accent }}
      >
        <Icon size={20} strokeWidth={2} />
      </div>
    </div>
  );
}
