"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  {
    href: "/",
    label: "หน้าหลัก",
    icon: CrossIcon,
    // รายการเคสเข้าจากหน้าหลัก
    match: (p) => p === "/" || p.startsWith("/cases"),
  },
  {
    href: "/registry",
    label: "ทะเบียน",
    icon: RegistryIcon,
    match: (p) => p.startsWith("/registry"),
  },
  {
    // ปุ่มกลาง = บันทึก — กดแล้วเด้งให้เลือก EMS / Refer (ดู RecordSheet)
    href: "/ems/new",
    label: "บันทึก",
    icon: AmbulanceIcon,
    match: (p) => p.startsWith("/ems") || p.startsWith("/refer"),
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
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {sheetOpen && <RecordSheet onClose={() => setSheetOpen(false)} />}
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
                  <button
                    type="button"
                    aria-haspopup="dialog"
                    aria-expanded={sheetOpen}
                    onClick={() => setSheetOpen((o) => !o)}
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
                        active
                          ? "font-semibold text-(--accent)"
                          : "text-(--muted)"
                      }`}
                    >
                      {tab.label}
                    </span>
                  </button>
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
                      active
                        ? "font-semibold text-(--accent)"
                        : "text-(--muted)"
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
    </>
  );
}

/** แผ่นเลือกประเภทการบันทึก — เด้งขึ้นเหนือแถบเมนูล่าง */
function RecordSheet({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="เลือกประเภทการบันทึก"
      className="fixed inset-0 z-40 flex items-end bg-black/35 print:hidden"
      onClick={onClose}
    >
      <div
        className="mx-auto mb-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+12px)] w-full max-w-[640px] px-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-2xl bg-white p-3 shadow-[0_10px_30px_rgba(0,0,0,.2)]">
          <p className="px-1 pb-2 text-[13px] font-semibold text-(--muted)">
            บันทึกอะไร?
          </p>
          <div className="grid grid-cols-2 gap-2.5">
            <Link
              href="/ems/new"
              onClick={onClose}
              className="rounded-xl bg-(--accent) px-3 py-4 text-center text-white active:scale-[.97]"
            >
              <AmbulanceIcon className="mx-auto mb-1 size-8" />
              <span className="block text-[15px] font-bold">บันทึกออกเหตุ</span>
              <span className="block text-[11.5px] opacity-90">EMS</span>
            </Link>
            <Link
              href="/refer/new"
              onClick={onClose}
              className="rounded-xl border-2 border-(--accent) bg-white px-3 py-4 text-center text-(--accent) active:scale-[.97]"
            >
              <UserIcon className="mx-auto mb-1 size-8" />
              <span className="block text-[15px] font-bold">Refer</span>
              <span className="block text-[11.5px] opacity-80">
                ส่งต่อผู้ป่วย
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
