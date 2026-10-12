import Link from "next/link";
import { ArrowRight, Film } from "lucide-react";
import { tmdbImage, type TmdbSize } from "@/lib/tmdb-image";
import { getI18n } from "@/lib/i18n/server";

/*
 * ชิ้นส่วนร่วมของหลังบ้าน — โทนเดียวกับหน้าเว็บ (ดำ–ทอง, เส้นบาง, หัวข้อ Bodoni)
 * ทองใช้เฉพาะจุดที่มีความหมาย (อันดับ 1, ค่าที่เน้น, ลิงก์) ไม่ใช้สีรุ้งแยกการ์ด
 */

export type IconType = React.ComponentType<{ size?: number; className?: string }>;

export const cardCls = "rounded-[4px] border border-line bg-surface";

/** ปุ่มลัดแบบเส้นขอบบาง */
export const quickBtn =
  "inline-flex items-center justify-center gap-2 rounded-[4px] border border-line px-3.5 py-2 text-sm text-cream/80 transition " +
  "hover:border-gold-dark hover:text-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light";

/* ---------- หัวหน้า ---------- */

export async function PageHeader({
  title, description, updatedAt, actions,
}: { title: string; description: string; updatedAt?: string; actions?: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <h1 className="font-editorial text-4xl text-cream md:text-5xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm text-cream/70">{description}</p>
        {updatedAt && <p className="mt-2 text-xs text-muted">{t.admin.dataAsOf(updatedAt)}</p>}
      </div>
      {actions && <nav className="flex flex-wrap gap-2" aria-label={t.admin.shortcuts}>{actions}</nav>}
    </header>
  );
}

/* ---------- Panel ---------- */

export async function Panel({
  title, icon: Icon, subtitle, href, hrefLabel,
  className = "", flush = false, children,
}: {
  title: string;
  icon?: IconType;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  /** ไม่ใส่ padding ในเนื้อหา (ใช้กับตารางที่ต้องชิดขอบ) */
  flush?: boolean;
  children: React.ReactNode;
}) {
  const { t } = await getI18n();
  return (
    <section className={`${cardCls} flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-editorial text-xl text-cream">
            {Icon && <Icon size={16} className="shrink-0 text-gold-light" />}
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 rounded-sm text-sm text-gold-light underline decoration-gold-dark underline-offset-[6px] hover:decoration-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
          >
            {hrefLabel ?? t.common.viewAll} <ArrowRight size={14} aria-hidden />
          </Link>
        )}
      </div>
      <div className={`flex-1 ${flush ? "" : "p-5"}`}>{children}</div>
    </section>
  );
}

/* ---------- ชิ้นเล็ก ---------- */

/** เลขอันดับตัวเอียง — อันดับ 1 สีทอง ที่เหลือสีจาง */
export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={`inline-block w-6 shrink-0 text-center font-editorial text-xl italic leading-none tabular-nums ${
        rank === 1 ? "text-gold-light" : "text-cream/50"
      }`}
    >
      {rank}
    </span>
  );
}

export function Thumb({
  src,
  alt,
  className,
  size = "w92",
}: {
  src: string | null;
  alt: string;
  className: string;
  size?: TmdbSize;
}) {
  if (!src) {
    return (
      <div className={`${className} flex items-center justify-center bg-ink text-muted`} aria-hidden>
        <Film size={16} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- URL ภายนอกจากฐานข้อมูล ไม่ต้องตั้งค่า remotePatterns
  return <img src={tmdbImage(src, size) ?? src} alt={alt} loading="lazy" className={`${className} object-cover`} />;
}

/** แถบสัดส่วนแบบรายการ (HTML ล้วน) */
export async function BarRows({
  rows, format = (n) => String(n),
}: {
  rows: { label: string; value: number }[];
  format?: (n: number) => string;
}) {
  const { t } = await getI18n();
  if (rows.length === 0) return <p className="text-sm text-muted">{t.admin.noData}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-cream">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted">
              {format(r.value)} · {Math.round((r.value / total) * 100)}%
            </span>
          </div>
          <div className="h-[3px] bg-line">
            <div className="h-full bg-gold-gradient" style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const thCls = "px-2 py-3 font-normal";
export const rowCls = "transition-colors hover:bg-ink/60";
