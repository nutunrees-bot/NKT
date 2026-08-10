"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "EMS Command Center", match: (p: string) => p === "/" },
  {
    href: "/refer",
    label: "Refer In / Out",
    match: (p: string) => p.startsWith("/refer"),
  },
  {
    href: "/triage",
    label: "Triage Summary",
    match: (p: string) => p.startsWith("/triage"),
  },
];

export default function AppTabs() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-(--border-hairline) bg-(--surface-1)">
      <div className="mx-auto flex max-w-[1600px] gap-1 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`relative whitespace-nowrap px-3 py-3 text-sm font-medium transition-colors ${
                active
                  ? "text-(--brand-navy)"
                  : "text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              {tab.label}
              {active && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-(--brand-navy)" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
