/**
 * ไอคอน SVG ในไฟล์ — ไม่ต้องพึ่งไลบรารีไอคอนเพิ่ม
 * ทุกตัวใช้ currentColor เปลี่ยนสีตามข้อความรอบๆ ได้
 */
type IconProps = { className?: string };

function Svg({
  className = "size-6",
  children,
}: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** กาชาด (หน้าหลัก) */
export function CrossIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z" />
    </Svg>
  );
}

/** ทะเบียนผู้ป่วย */
export function RegistryIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <rect x="4.5" y="3.5" width="15" height="17" rx="2.5" />
      <path d="M9 3.5v2h6v-2" />
      <circle cx="12" cy="10.5" r="2.2" />
      <path d="M8.3 16.5c.6-1.7 2-2.6 3.7-2.6s3.1.9 3.7 2.6" />
    </Svg>
  );
}

/** รถพยาบาล (ปุ่มกลาง = รายการเคส) */
export function AmbulanceIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M2.5 16.5V7.5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v9" />
      <path d="M14.5 9.5h3.6l3.4 3.7v3.3h-1.7" />
      <path d="M2.5 16.5h1.8M9.8 16.5h5.2" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17.5" cy="17" r="2" />
      <path d="M8.5 9v4M6.5 11h4" />
    </Svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
      <circle cx="12" cy="10" r="2.4" />
    </Svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="12" cy="8" r="3.8" />
      <path d="M4.5 20.5c.9-3.6 3.9-5.6 7.5-5.6s6.6 2 7.5 5.6" />
    </Svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.2-4.2" />
    </Svg>
  );
}

export function PencilIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" />
      <path d="m13.5 6.5 4 4" />
    </Svg>
  );
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M7 9V3.5h10V9" />
      <rect x="3.5" y="9" width="17" height="8" rx="2" />
      <path d="M7 14h10v6.5H7z" />
    </Svg>
  );
}

export function SheetIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 3.5H6.5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V8z" />
      <path d="M14 3.5V8h4.5" />
      <path d="m9.5 12 5 5M14.5 12l-5 5" />
    </Svg>
  );
}

export function LogoutIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" />
      <path d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
    </Svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m9 5 7 7-7 7" />
    </Svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <Svg className={className}>
      <path d="m15 5-7 7 7 7" />
    </Svg>
  );
}
