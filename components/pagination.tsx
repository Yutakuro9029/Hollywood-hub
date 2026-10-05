import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  "inline-flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-medium transition";
const itemIdle =
  "border-zinc-300 text-zinc-700 hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:text-amber-300";
const itemDisabled =
  "cursor-not-allowed border-zinc-200 text-zinc-400 dark:border-zinc-800 dark:text-zinc-600";

export default function Pagination({ page, totalPages, basePath, params = {} }: Props) {
  if (totalPages <= 1) return null;

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
      aria-label="แบ่งหน้า"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={`${itemBase} ${itemIdle} gap-1`}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">ก่อนหน้า</span>
          <span className="sr-only sm:hidden">ก่อนหน้า</span>
        </Link>
      ) : (
        <span aria-disabled className={`${itemBase} ${itemDisabled} gap-1`}>
          <ChevronLeft className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">ก่อนหน้า</span>
        </span>
      )}

      {buildPages(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-zinc-500" aria-hidden>
            …
          </span>
        ) : p === page ? (
          <span
            key={p}
            aria-current="page"
            className={`${itemBase} border-amber-400 bg-amber-400 text-slate-950`}
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
          <span className="hidden sm:inline">ถัดไป</span>
          <span className="sr-only sm:hidden">ถัดไป</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : (
        <span aria-disabled className={`${itemBase} ${itemDisabled} gap-1`}>
          <span className="hidden sm:inline">ถัดไป</span>
          <ChevronRight className="h-4 w-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
