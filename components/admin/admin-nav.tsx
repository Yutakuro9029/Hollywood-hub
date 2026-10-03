"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, Film, LayoutDashboard, Trophy, Users } from "lucide-react";

type Item = { href: string; label: string; icon: React.ComponentType<{ size?: number }>; exact?: boolean };

const groups: { title: string; items: Item[] }[] = [
  {
    title: "Dashboard",
    items: [
      { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "วิเคราะห์เชิงกราฟ", icon: BarChart3 },
      { href: "/admin/rankings", label: "อันดับ & ผลงาน", icon: Trophy },
      { href: "/admin/insights", label: "ข้อมูลล่าสุด & คุณภาพ", icon: Activity },
    ],
  },
  {
    title: "จัดการข้อมูล",
    items: [
      { href: "/admin/actors", label: "จัดการดารา", icon: Users },
      { href: "/admin/movies", label: "จัดการภาพยนตร์", icon: Film },
    ],
  },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:gap-0 md:overflow-visible md:px-4 md:pb-0">
      {groups.map((group) => (
        <div key={group.title} className="flex gap-1 md:flex-col md:pb-4">
          <p className="hidden px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 md:block">
            {group.title}
          </p>
          {group.items.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-amber-400/10 text-amber-600 dark:text-amber-400"
                    : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                }`}
              >
                <Icon size={18} /> {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
