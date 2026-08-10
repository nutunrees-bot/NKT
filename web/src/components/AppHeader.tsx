import Image from "next/image";

export default function AppHeader() {
  return (
    <header className="bg-(--brand-navy) text-white">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Image
            src="/logo-hos.jpg"
            alt="ตราโรงพยาบาลสมเด็จพระยุพราชนครไทย"
            width={40}
            height={40}
            className="rounded-full shrink-0"
          />
          <Image
            src="/logo-er.jpg"
            alt="โลโก้ทีมกู้ชีพ NKT ER"
            width={40}
            height={40}
            className="rounded-full shrink-0"
          />
          <div className="min-w-0">
            <h1 className="truncate text-base font-bold leading-tight sm:text-lg">
              NKT Rescue &amp; Refer
            </h1>
            <p className="truncate text-[11px] text-white/70 sm:text-xs">
              ศูนย์ข้อมูลกู้ชีพ &middot; ส่งต่อผู้ป่วย &middot; คัดกรองฉุกเฉิน
              รพร.นครไทย
            </p>
          </div>
        </div>

        <div className="hidden shrink-0 items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium sm:flex">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--status-good) opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-(--status-good)" />
          </span>
          สถานะระบบ: เชื่อมต่อฐานข้อมูลหลัก
        </div>
      </div>
    </header>
  );
}
