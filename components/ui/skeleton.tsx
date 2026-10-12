import type { ComponentPropsWithoutRef, ReactNode } from "react";

/**
 * Skeleton primitive — บล็อกเทาเข้มมีประกายทองวิ่งผ่าน (คลาส .skeleton ใน globals.css)
 * ปรับขนาด/รูปทรงผ่าน className (เช่น "h-4 w-32", "aspect-[2/3]")
 * ปิดแอนิเมชันอัตโนมัติสำหรับผู้ใช้ที่ตั้งค่า reduced motion
 */
export function Skeleton({
  className = "",
  ...props
}: ComponentPropsWithoutRef<"div">) {
  return (
    <div
      aria-hidden
      className={`skeleton rounded-[4px] ${className}`}
      {...props}
    />
  );
}

/**
 * ห่อหน้า loading ทั้งหน้า — บอก screen reader ว่ากำลังโหลด
 * (ตัว Skeleton แต่ละชิ้นเป็น aria-hidden อยู่แล้ว)
 */
export function SkeletonRegion({
  label,
  className = "",
  children,
}: {
  /** ข้อความที่ screen reader อ่าน (ตามภาษาที่เลือก) */
  label: string;
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

/** กรอบการ์ดมาตรฐานของโปรเจกต์ */
export const skeletonCardCls = "rounded-card border border-line bg-surface";
