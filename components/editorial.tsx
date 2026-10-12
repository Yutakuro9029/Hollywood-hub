import type { ReactNode } from "react";
import { getInitials } from "@/lib/format";
import { tmdbImage } from "@/lib/tmdb-image";

/*
 * ชิ้นส่วนร่วมของสไตล์ "ทำเนียบดารา" (หน้าแรก หน้าดารา และหน้ารายละเอียดดารา)
 * เส้นบาง + หัวข้อ Bodoni Moda + ทองเฉพาะจุดที่มีความหมาย
 */

export const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

/** ลิงก์ข้อความสีทองขีดเส้นใต้ */
export const goldLink =
  "rounded-sm text-gold-light underline decoration-gold-dark underline-offset-[6px] transition-colors hover:decoration-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light";

/** หัวข้อ section แบบนิตยสาร: เส้นเต็มความกว้าง หัวข้อซ้าย คำอธิบาย/ลิงก์ขวา */
export function SectionHead({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-t border-line pt-6">
      <h2 id={id} className="font-editorial text-3xl text-cream sm:text-4xl">
        {title}
      </h2>
      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm text-muted">
        {description && <p>{description}</p>}
        {action}
      </div>
    </div>
  );
}

/** รูปดาราวงกลมขอบทอง */
export function Face({
  name,
  url,
  className = "h-12 w-12",
  size = "w185",
}: {
  name: string;
  url: string | null;
  className?: string;
  size?: "w92" | "w185";
}) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-full bg-surface ring-1 ring-gold-dark ${className}`}>
      <span aria-hidden className="absolute inset-0 flex items-center justify-center font-editorial text-sm text-gold-light">
        {getInitials(name)}
      </span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={tmdbImage(url, size) ?? undefined} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      )}
    </span>
  );
}

/** แถบทองยาวตามสัดส่วน (0–1) — ใช้กับอันดับ/สัดส่วนต่าง ๆ */
export function GoldBar({ share, className = "mt-2" }: { share: number; className?: string }) {
  return (
    <span aria-hidden className={`block h-[3px] bg-line ${className}`}>
      <span className="block h-full bg-gold-gradient" style={{ width: `${Math.round(Math.max(0, Math.min(1, share)) * 100)}%` }} />
    </span>
  );
}
