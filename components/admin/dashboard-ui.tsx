import Link from "next/link";
import { ArrowRight, Clock, Film } from "lucide-react";
import DashboardTabs from "@/components/admin/dashboard-tabs";

export type IconType = React.ComponentType<{ size?: number; className?: string }>;

export const cardCls =
  "rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-slate-900";

/**
 * ปุ่มลัด (จัดการดารา / จัดการภาพยนตร์ / ดูหน้าเว็บไซต์) — สไตล์เดียวกันทุกปุ่ม
 * พื้นปกติเปลี่ยนตาม theme และตอน hover จะเปลี่ยนเป็นโทนอำพัน แยกค่าสีสำหรับ Light / Dark
 */
export const quickBtn =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition " +
  "hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 " +
  "dark:border-zinc-700 dark:bg-slate-900 dark:text-zinc-200 " +
  "dark:hover:border-amber-400 dark:hover:bg-amber-400/10 dark:hover:text-amber-300";

/* ---------- Header (hero) + Tabs ---------- */

export function PageHeader({
  title, description, updatedAt, actions,
}: { title: string; description: string; updatedAt?: string; actions?: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <header className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-amber-100/70 via-white to-white p-6 shadow-sm dark:border-zinc-800 dark:from-amber-400/10 dark:via-slate-900 dark:to-slate-950 md:p-8">
        <div aria-hidden className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-400/25 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -bottom-28 left-1/3 h-52 w-52 rounded-full bg-sky-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              🎬 Hollywood Hub · Admin
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
            {updatedAt && (
              <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                <Clock size={12} /> อัปเดตล่าสุด {updatedAt}
              </p>
            )}
          </div>
          {actions && <nav className="flex flex-wrap gap-2" aria-label="Quick actions">{actions}</nav>}
        </div>
      </header>

      <DashboardTabs />
    </div>
  );
}

/* ---------- Cards ---------- */

export function KpiCard({
  label, value, suffix, icon: Icon, gradient,
}: { label: string; value: string; suffix?: string; icon: IconType; gradient: string }) {
  return (
    <div className={`${cardCls} group flex items-center gap-4 p-5 transition hover:-translate-y-0.5 hover:shadow-md`}>
      <div className={`rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${gradient}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-2xl font-bold tabular-nums">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">{suffix}</span>
          )}
        </p>
      </div>
    </div>
  );
}

export function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${cardCls} px-4 py-3`}>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

export function Highlight({
  icon: Icon, label, title, sub, tone,
}: { icon: IconType; label: string; title: string; sub: string; tone: string }) {
  return (
    <div className={`${cardCls} flex items-start gap-3 p-4`}>
      <div className={`rounded-lg p-2.5 ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-semibold">{title}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      </div>
    </div>
  );
}

export function Panel({
  title, icon: Icon, tone = "text-amber-400", subtitle, href, hrefLabel = "ดูทั้งหมด",
  className = "", flush = false, children,
}: {
  title: string;
  icon: IconType;
  tone?: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  /** ไม่ใส่ padding ในเนื้อหา (ใช้กับตารางที่ต้องชิดขอบ) */
  flush?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={`${cardCls} flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon size={18} className={tone} />
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400 dark:hover:text-amber-300"
          >
            {hrefLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className={`flex-1 ${flush ? "" : "p-5"}`}>{children}</div>
    </section>
  );
}

/** การ์ดลิงก์ไปหน้าย่อยของ Dashboard */
export function NavCard({
  href, icon: Icon, title, description, gradient,
}: { href: string; icon: IconType; title: string; description: string; gradient: string }) {
  return (
    <Link
      href={href}
      className={`${cardCls} group flex items-start gap-4 p-5 transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:hover:border-amber-400`}
    >
      <div className={`rounded-xl bg-gradient-to-br p-3 text-white shadow-lg ${gradient}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 font-semibold">
          {title}
          <ArrowRight size={14} className="transition group-hover:translate-x-1" />
        </p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
      </div>
    </Link>
  );
}

/* ---------- Small pieces ---------- */

export function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-amber-400 text-zinc-900"
      : rank === 2
        ? "bg-zinc-300 text-zinc-800 dark:bg-zinc-600 dark:text-zinc-100"
        : rank === 3
          ? "bg-orange-300 text-orange-950 dark:bg-orange-700 dark:text-orange-50"
          : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style}`}>
      {rank}
    </span>
  );
}

export function Thumb({ src, alt, className }: { src: string | null; alt: string; className: string }) {
  if (!src) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800`}
        aria-hidden
      >
        <Film size={16} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- URL ภายนอกจากฐานข้อมูล ไม่ต้องตั้งค่า remotePatterns
  return <img src={src} alt={alt} loading="lazy" className={`${className} object-cover`} />;
}

/** แถบสัดส่วนแบบรายการ (HTML ล้วน) */
export function BarRows({
  rows, format = (n) => String(n), barClass = "bg-amber-400",
}: {
  rows: { label: string; value: number }[];
  format?: (n: number) => string;
  barClass?: string;
}) {
  if (rows.length === 0) return <p className="text-sm text-zinc-500">ยังไม่มีข้อมูล</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  const total = rows.reduce((s, r) => s + r.value, 0);
  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate">{r.label}</span>
            <span className="shrink-0 tabular-nums text-zinc-500 dark:text-zinc-400">
              {format(r.value)} · {Math.round((r.value / total) * 100)}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div className={`h-full rounded-full ${barClass}`} style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export const thCls = "px-2 py-3 font-medium";
export const rowCls = "transition hover:bg-zinc-50 dark:hover:bg-slate-800/50";
