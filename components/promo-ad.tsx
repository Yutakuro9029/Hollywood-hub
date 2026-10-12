"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

/** แบนเนอร์โฆษณาลอยมุมขวาล่าง (ล้อเลียนโฆษณาเว็บพนัน) — โผล่หลังเปิดหน้าเล็กน้อย กด × เพื่อปิด */
export default function PromoAd() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setOpen(true), 1200);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  return (
    <aside
      aria-label="โฆษณา"
      className="animate-fade-slide fixed bottom-4 right-4 z-50 w-[220px] sm:w-[280px]"
    >
      <div className="overflow-hidden rounded-[4px] bg-black shadow-2xl shadow-black/60 ring-1 ring-gold/60">
        <div className="flex items-center justify-between bg-white/95 px-2 py-0.5 text-[10px] text-neutral-600">
          <span>โฆษณา · Sponsored</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="ปิดโฆษณา"
            className="-mr-1 flex h-5 w-5 items-center justify-center rounded-sm text-neutral-700 hover:bg-neutral-200"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
        <a href="https://devbanban.com" target="_blank" rel="noopener noreferrer sponsored" className="block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/devbanban-promo.gif"
            alt="โฆษณาล้อเลียนสไตล์เว็บพนันสำหรับ devbanban.com เว็บสอนเขียนโปรแกรม"
            width={640}
            height={640}
            className="block h-auto w-full"
          />
        </a>
      </div>
      <p className="mt-1 text-right text-[10px] leading-tight text-muted">
        *ภาพล้อเลียน ไม่เกี่ยวกับการพนัน
      </p>
    </aside>
  );
}
