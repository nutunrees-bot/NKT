"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AmbulanceIcon,
  CrossIcon,
  PinIcon,
  RegistryIcon,
  UserIcon,
} from "@/components/shell/icons";

type Tab = {
  href: string;
  label: string;
  icon: (p: { className?: string }) => React.ReactNode;
  /** path อื่นที่ถือว่าอยู่แท็บนี้ (เช่น ฟอร์ม EMS/Refer อยู่ใต้รายการเคส) */
  match: (path: string) => boolean;
};

const TABS: Tab[] = [
  { href: "/", label: "หน้าหลัก", icon: CrossIcon, match: (p) => p === "/" },
  {
    href: "/registry",
    label: "ทะเบียน",
    icon: RegistryIcon,
    match: (p) => p.startsWith("/registry"),
  },
  {
    href: "/cases",
    label: "รายการเคส",
    icon: AmbulanceIcon,
    match: (p) =>
      p.startsWith("/cases") || p.startsWith("/ems") || p.startsWith("/refer"),
  },
  {
    href: "/area",
    label: "พื้นที่",
    icon: PinIcon,
    match: (p) => p.startsWith("/area") || p.startsWith("/summary"),
  },
  {
    href: "/profile",
    label: "โปรไฟล์",
    icon: UserIcon,
    match: (p) => p.startsWith("/profile"),
  },
];

/**
 * แถบเมนูล่างแบบแอปมือถือ — ปุ่มกลาง (รถพยาบาล) ยกลอยเป็นวงกลม
 * เว้นขอบล่างตาม safe-area ของ iPhone
 */
export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนูหลัก"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-(--line) bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur print:hidden"
    >
      <ul className="mx-auto grid h-(--tabbar-h) max-w-[640px] grid-cols-5 items-end px-1">
        {TABS.map((tab, i) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;

          if (i === 2) {
            return (
              <li key={tab.href} className="flex justify-center">
                <Link
                  href={tab.href}
                  aria-current={active ? "page" : undefined}
                  className="group -mt-7 flex flex-col items-center gap-1 pb-2"
                >
                  <span
                    className={`flex size-[60px] items-center justify-center rounded-full border-4 border-(--page-bg) text-white shadow-[0_6px_16px_rgba(211,47,47,.35)] transition group-active:scale-95 ${
                      active ? "bg-(--accent-dark)" : "bg-(--accent)"
                    }`}
                  >
                    <Icon className="size-7" />
                  </span>
                  <span
                    className={`text-[11px] leading-none ${
                      active ? "font-semibold text-(--accent)" : "text-(--muted)"
                    }`}
                  >
                    {tab.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={tab.href} className="flex justify-center">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className="flex w-full flex-col items-center gap-1 pt-2 pb-2"
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition ${
                    active
                      ? "bg-(--accent-soft) text-(--accent)"
                      : "text-(--muted)"
                  }`}
                >
                  <Icon className="size-[22px]" />
                </span>
                <span
                  className={`text-[11px] leading-none ${
                    active ? "font-semibold text-(--accent)" : "text-(--muted)"
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
