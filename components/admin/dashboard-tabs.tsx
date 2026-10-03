"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart3, LayoutDashboard, Trophy } from "lucide-react";

const TABS = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard, exact: true },
  { href: "/admin/analytics", label: "วิเคราะห์เชิงกราฟ", icon: BarChart3, exact: false },
  { href: "/admin/rankings", label: "อันดับ & ผลงาน", icon: Trophy, exact: false },
  { href: "/admin/insights", label: "ข้อมูลล่าสุด & คุณภาพ", icon: Activity, exact: false },
] as const;

export default function DashboardTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="เมนู Dashboard"
      className="flex gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-slate-900"
    >
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
              active
                ? "bg-amber-400 text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            }`}
          >
            <Icon size={16} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
