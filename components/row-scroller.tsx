"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/**
 * แถวเลื่อนแนวนอน: มือถือปัดนิ้ว (scroll-snap) / จอใหญ่มีปุ่มเลื่อนซ้าย-ขวา
 * ปุ่มซ่อนเองเมื่อเลื่อนสุดทางแล้ว
 */
export default function RowScroller({
  label,
  ordered = false,
  className = "",
  children,
}: {
  label: string;
  /** true = <ol> (รายการที่มีลำดับ เช่น Top 10) */
  ordered?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLUListElement & HTMLOListElement>(null);
  const List = ordered ? "ol" : "ul";
  const [edges, setEdges] = useState({ start: true, end: false });
  const { t } = useI18n();

  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // วัดตอนเริ่มผ่าน ResizeObserver (เรียก callback เองครั้งแรก) แทนการ setState ตรง ๆ ใน effect
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    el.addEventListener("scroll", measure, { passive: true });
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", measure);
    };
  }, [measure]);

  function page(dir: 1 | -1) {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  }

  const btn =
    "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-[4px] border border-line bg-ink/85 text-cream backdrop-blur transition-[opacity,border-color,color] duration-300 hover:border-gold-dark hover:text-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light md:flex";

  return (
    <div className="relative">
      <List
        ref={ref}
        aria-label={label}
        className={`scrollbar-none flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-4 pt-3 sm:gap-5 sm:scroll-px-6 sm:px-6 lg:scroll-px-10 lg:px-10 ${className}`}
      >
        {children}
      </List>
      <button
        type="button"
        onClick={() => page(-1)}
        aria-label={t.common.scrollLeft(label)}
        className={`${btn} left-2 lg:left-4 ${edges.start ? "pointer-events-none opacity-0" : "opacity-100"}`}
        tabIndex={edges.start ? -1 : 0}
      >
        <ChevronLeft className="h-5 w-5" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => page(1)}
        aria-label={t.common.scrollRight(label)}
        className={`${btn} right-2 lg:right-4 ${edges.end ? "pointer-events-none opacity-0" : "opacity-100"}`}
        tabIndex={edges.end ? -1 : 0}
      >
        <ChevronRight className="h-5 w-5" aria-hidden />
      </button>
    </div>
  );
}
