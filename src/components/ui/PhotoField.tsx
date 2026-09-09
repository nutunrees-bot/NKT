"use client";

import { useRef } from "react";

/** ย่อรูปก่อนส่งขึ้นเซิร์ฟเวอร์ (กว้างไม่เกิน 900px, JPEG 70%) เหมือนแอปเดิม */
async function shrink(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("อ่านรูปไม่สำเร็จ"));
    el.src = dataUrl;
  });

  const scale = Math.min(1, 900 / img.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.7);
}

export default function PhotoField({
  value,
  onChange,
}: {
  value: string;
  onChange: (dataUrl: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) onChange(await shrink(file));
        }}
        className="text-[13px]"
      />
      {value && (
        <div className="mt-1.5 flex items-center gap-2">
          {/* รูปถ่ายหน้างานเป็น data URL / signed URL ชั่วคราว next/image ไม่ช่วยอะไร */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="รูปถ่ายยืนยัน"
            className="max-h-[140px] max-w-[140px] rounded-md border border-[#ccc]"
          />
          <button
            type="button"
            onClick={() => {
              if (inputRef.current) inputRef.current.value = "";
              onChange("");
            }}
            className="rounded-lg border border-(--line) bg-white px-3 py-1.5 text-[12px]"
          >
            🗑️ ลบรูป
          </button>
        </div>
      )}
    </div>
  );
}
