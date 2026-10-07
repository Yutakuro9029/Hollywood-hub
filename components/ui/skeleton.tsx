import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Skeleton primitive — บล็อกสีเทาเรียบ ๆ พร้อมแอนิเมชัน pulse
 * ปรับขนาด/รูปทรงผ่าน className (เช่น "h-4 w-32", "aspect-[2/3] rounded-xl")
 * ปิดแอนิเมชันอัตโนมัติสำหรับผู้ใช้ที่ตั้งค่า reduced motion
 */
export function Skeleton({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-md bg-zinc-200 motion-reduce:animate-none dark:bg-zinc-800/80 ${className}`}
      {...props}
    />
  );
}

/**
 * ห่อหน้า loading ทั้งหน้า — บอก screen reader ว่ากำลังโหลด
 * (ตัว Skeleton แต่ละชิ้นเป็น aria-hidden อยู่แล้ว)
 */
export function SkeletonRegion({
  label = "กำลังโหลดข้อมูล",
  className = "",
  children,
}: {
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">{label}…</span>
      {children}
    </div>
  );
}

/** กรอบการ์ดมาตรฐานของโปรเจกต์ (ขอบ + พื้นหลังเข้ากับธีม Light/Dark) */
export const skeletonCardCls =
  "rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-slate-900";
