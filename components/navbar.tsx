import Link from "next/link";
import { Clapperboard, LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";

const NAV_LINKS = [
  { href: "/", label: "หน้าแรก" },
  { href: "/actors", label: "รายชื่อดารา" },
  { href: "/movies", label: "ภาพยนตร์เด่น" },
] as const;

/** อ่าน session แล้วตรวจซ้ำกับฐานข้อมูล (กรณี user ถูกลบ/เปลี่ยนสิทธิ์หลังออก cookie) */
async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.users.findUnique({
    where: { id: session.userId },
    select: { username: true, role: true },
  });
}

const outlineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-amber-500/70 px-3 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/60 dark:text-amber-300 sm:px-4";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/80 dark:bg-slate-950/85">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400"
        >
          <Clapperboard className="h-6 w-6" aria-hidden />
          <span className="text-base sm:text-lg">Hollywood Hub</span>
        </Link>

        {/* มือถือ: ลงมาอยู่แถวที่ 2 เต็มความกว้าง / จอ md ขึ้นไป: อยู่กลางแถวเดียวกับโลโก้ */}
        <nav
          aria-label="เมนูหลัก"
          className="order-last flex w-full items-center gap-1 overflow-x-auto md:order-none md:w-auto"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-200/70 hover:text-amber-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-amber-300"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />

          {!user && (
            <Link href="/login" className={outlineBtn}>
              <LogIn className="h-4 w-4" aria-hidden />
              เข้าสู่ระบบ
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link href="/admin" className={outlineBtn} aria-label="แดชบอร์ดหลังบ้าน">
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">แดชบอร์ดหลังบ้าน</span>
              <span className="sm:hidden">แอดมิน</span>
            </Link>
          )}

          {user?.role === "USER" && (
            <span className="inline-flex max-w-32 items-center gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 sm:max-w-48">
              <User className="h-4 w-4 shrink-0" aria-hidden />
              <span className="hidden truncate sm:inline">{user.username}</span>
            </span>
          )}

          {user && (
            <form action={logout}>
              <button
                type="submit"
                aria-label="ออกจากระบบ"
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition hover:bg-red-500/10 hover:text-red-500 dark:text-zinc-400 dark:hover:text-red-400"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </header>
  );
}
