"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark } from "lucide-react";
import { useFavorites } from "@/lib/use-favorites";

/** แยกเป็น Client Component เพราะต้องอ่าน localStorage + pathname (Navbar เป็น Server Component) */
export default function WatchlistLink() {
  const { mounted, totalCount } = useFavorites();
  const pathname = usePathname();
  const active = pathname.startsWith("/watchlist");
  const count = mounted ? totalCount : 0; // ก่อน hydrate ไม่แสดงตัวเลข กัน mismatch

  return (
    <Link
      href="/watchlist"
      aria-current={active ? "page" : undefined}
      aria-label={count > 0 ? `รายการโปรด ${count} รายการ` : "รายการโปรด"}
      title="รายการโปรด"
      className={`relative inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950 ${
        active
          ? "border-amber-400 bg-amber-400/15 text-amber-700 dark:text-amber-300"
          : "border-zinc-300 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-900 dark:text-amber-400 dark:hover:bg-zinc-800"
      }`}
    >
      <Bookmark className="h-4 w-4" fill={count > 0 ? "currentColor" : "none"} aria-hidden />
      {count > 0 && (
        <span
          aria-hidden
          className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[11px] font-bold leading-none text-slate-950 ring-2 ring-zinc-50 dark:ring-slate-950"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
