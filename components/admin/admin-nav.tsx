"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n/client";
import type { Dict } from "@/lib/i18n/dictionaries";

type Item = { href: string; label: string; exact?: boolean };

const groups = (a: Dict["admin"]): { title: string; items: Item[] }[] => [
  {
    title: a.groupDashboard,
    items: [
      { href: "/admin", label: a.overview, exact: true },
      { href: "/admin/analytics", label: a.analytics },
      { href: "/admin/rankings", label: a.rankings },
      { href: "/admin/insights", label: a.insights },
    ],
  },
  {
    title: a.groupManage,
    items: [
      { href: "/admin/actors", label: a.manageActors },
      { href: "/admin/movies", label: a.manageMovies },
    ],
  },
];

/** เมนูหลังบ้าน: ตัวอักษรล้วน หน้าที่เลือกอยู่มีเส้นทองด้านซ้าย (จอเล็กเป็นแถบเลื่อนแนวนอน) */
export default function AdminNav() {
  const pathname = usePathname();
  const { t } = useI18n();

  return (
    <nav aria-label={t.admin.navLabel} className="flex gap-5 overflow-x-auto px-4 pb-3 scrollbar-none md:flex-col md:gap-6 md:overflow-visible md:px-0 md:pb-0">
      {groups(t.admin).map((group) => (
        <div key={group.title} className="flex shrink-0 gap-4 md:flex-col md:gap-0">
          <p className="hidden px-6 pb-2 text-xs text-muted md:block">{group.title}</p>
          {group.items.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative shrink-0 whitespace-nowrap py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light md:px-6 md:py-2 ${
                  active ? "text-gold-light" : "text-cream/65 hover:text-cream"
                }`}
              >
                {active && (
                  <span aria-hidden className="absolute inset-x-0 -bottom-px h-px bg-gold md:inset-x-auto md:inset-y-1.5 md:left-0 md:h-auto md:w-[2px]" />
                )}
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
