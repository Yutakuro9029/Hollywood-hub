"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const WAIT_SECONDS = 3;

/** ป๊อปอัปโฆษณากลางจอ (ล้อเลียนเว็บพนัน) — เด้งทันทีที่เข้าหน้า ต้องรอ 3 วินาทีถึงกดปิดได้ */
export default function PromoPopup() {
  const [open, setOpen] = useState(true);
  const [left, setLeft] = useState(WAIT_SECONDS);
  const canClose = left <= 0;

  useEffect(() => {
    if (!open || left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [open, left]);

  // ล็อกการเลื่อนหน้าระหว่างเปิดป๊อปอัป
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open || !canClose) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, canClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="โฆษณา devbanban.com"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      onClick={() => canClose && setOpen(false)}
    >
      <div className="animate-fade-slide relative w-full max-w-[400px]" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={!canClose}
          aria-label={canClose ? "ปิดโฆษณา" : `ปิดได้ใน ${left} วินาที`}
          className="absolute -right-3 -top-3 z-10 flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-2 text-sm font-semibold text-neutral-800 shadow-lg ring-2 ring-gold transition enabled:hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-90"
        >
          {canClose ? <X className="h-5 w-5" aria-hidden /> : <span className="tabular-nums">{left}</span>}
        </button>

        <a
          href="https://devbanban.com"
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block overflow-hidden rounded-[6px] shadow-2xl shadow-black ring-2 ring-gold/70"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/devbanban-popup.png"
            alt="ป๊อปอัปโฆษณาล้อเลียนสไตล์เว็บพนันสำหรับ devbanban.com เว็บสอนเขียนโปรแกรม"
            width={720}
            height={960}
            className="block h-auto max-h-[85vh] w-full object-contain"
          />
        </a>
        <p className="mt-2 text-center text-xs text-white/70" aria-live="polite">
          {canClose ? "กด × หรือคลิกพื้นหลังเพื่อปิด" : `ปิดได้ใน ${left} วินาที...`}
        </p>
      </div>
    </div>
  );
}
