import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";

type Props = {
  page: number;
  totalPages: number;
  basePath: string;
  /** ตัวกรองปัจจุบัน (q, nationality, genre ...) ที่ต้องคงไว้เมื่อเปลี่ยนหน้า */
  params?: Record<string, string>;
};

/** เลือกเลขหน้าที่จะแสดง: หน้าแรก, หน้าสุดท้าย, หน้าปัจจุบัน ±1 และ "…" คั่น */
function buildPages(page: number, total: number): (number | "…")[] {
  const pages = Array.from(
    new Set([1, total, page - 1, page, page + 1].filter((p) => p >= 1 && p <= total)),
  ).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push("…");
    result.push(p);
  });
  return result;
}

const itemBase =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-[4px] border px-3 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light";
const itemIdle = "border-line text-cream/85 hover:border-gold-dark hover:text-gold-light";
const itemDisabled = "cursor-not-allowed border-line/60 text-muted/50";

export default async function Pagination({ page, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) return null;
  const { t } = await getI18n();

  const hrefFor = (p: number) => {
    const sp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) sp.set(key, value);
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  return (
    <nav
      aria-label={t.common.pagination}
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${itemBase} ${itemIdle} gap-1`}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t.common.prev}</span>
          <span className="sr-only sm:hidden">{t.common.prev}</span>
        </Link>
      ) : (
        <span aria-disabled className={`${itemBase} ${itemDisabled} gap-1`}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">{t.common.prev}</span>
        </span>
      )}

      {buildPages(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted" aria-hidden>
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${itemBase} border-gold bg-gold text-ink`}
          >
            {p}
          </span>
        ) : (
          <Link key={p} href={hrefFor(p)} className={`${itemBase} ${itemIdle}`}>
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className={`${itemBase} ${itemIdle} gap-1`}>
          <span className="hidden sm:inline">{t.common.next}</span>
          <span className="sr-only sm:hidden">{t.common.next}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={`${itemBase} ${itemDisabled} gap-1`}>
          <span className="hidden sm:inline">{t.common.next}</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
