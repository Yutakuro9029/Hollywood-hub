"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/actors", label: "รายชื่อดารา" },
  { href: "/movies", label: "ภาพยนตร์เด่น" },
] as const;

/** แยกเป็น Client Component เพราะต้องใช้ usePathname เพื่อไฮไลต์เมนูของหน้าปัจจุบัน */
export default function NavLinks() {
  const pathname = usePathname();

  return (
    <>
      {NAV_LINKS.map(({ href, label }) => {
        const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-amber-400 after:transition-transform after:duration-300 hover:after:scale-x-100 motion-reduce:transition-none motion-reduce:after:transition-none focus:outline-none focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-amber-400 ${
              active
                ? "text-amber-700 after:scale-x-100 dark:text-amber-300"
                : "text-zinc-700 after:scale-x-0 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </>
  );
}
