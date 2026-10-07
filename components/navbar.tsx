import Link from "next/link";
import { Clapperboard, LayoutDashboard, LogIn, LogOut } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { logout } from "@/app/actions/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import NavLinks from "@/components/nav-links";
import WatchlistLink from "@/components/watchlist-link";

/** อ่าน session แล้วตรวจซ้ำกับฐานข้อมูล (กรณี user ถูกลบ/เปลี่ยนสิทธิ์หลังออก cookie) */
async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.users.findUnique({
    where: { id: session.userId },
    select: { username: true, role: true },
  });
}

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-zinc-50/80 backdrop-blur-md dark:border-zinc-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-3 sm:px-6 lg:px-8">
        {/* โลโก้ */}
        <Link
          href="/"
          className={`group flex items-center gap-2.5 rounded-lg ${focusRing}`}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400 text-slate-950 shadow-sm shadow-amber-500/30 transition-transform duration-300 group-hover:-rotate-6 motion-reduce:transition-none">
            <Clapperboard className="h-5 w-5" aria-hidden />
          </span>
          <span className="font-display text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Hollywood Hub
          </span>
        </Link>

        {/* เมนูหลัก: มือถืออยู่แถวที่ 2 เต็มความกว้าง / จอ md ขึ้นไปอยู่กลางแถวเดียวกับโลโก้ */}
        <nav
          aria-label="เมนูหลัก"
          className="order-last -mx-3 flex w-full items-center gap-1 overflow-x-auto pb-1 md:order-none md:mx-0 md:w-auto md:pb-0"
        >
          <NavLinks />
        </nav>

        {/* ฝั่งขวา: สลับธีม + สถานะผู้ใช้ */}
        <div className="flex items-center gap-2 sm:gap-3">
          <WatchlistLink />
          <ThemeToggle />

          {!user && (
            <Link
              href="/login"
              className={`inline-flex items-center gap-2 rounded-lg border border-amber-500/70 px-3.5 py-2 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-400 hover:text-slate-950 motion-reduce:transition-none dark:border-amber-400/60 dark:text-amber-300 dark:hover:text-slate-950 ${focusRing}`}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              เข้าสู่ระบบ
            </Link>
          )}

          {user?.role === "ADMIN" && (
            <Link
              href="/admin"
              aria-label="แดชบอร์ดหลังบ้าน"
              className={`inline-flex items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-2 text-sm font-semibold text-slate-950 shadow-sm shadow-amber-500/20 transition-colors hover:bg-amber-300 motion-reduce:transition-none ${focusRing}`}
            >
              <LayoutDashboard className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">แดชบอร์ดหลังบ้าน</span>
              <span className="sm:hidden">แอดมิน</span>
            </Link>
          )}

          {user?.role === "USER" && (
            <span className="inline-flex max-w-40 items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-400/20 text-sm font-bold text-amber-700 ring-1 ring-amber-500/40 dark:text-amber-300"
              >
                {user.username.charAt(0).toUpperCase()}
              </span>
              <span className="hidden truncate sm:inline">{user.username}</span>
            </span>
          )}

          {user && (
            <form action={logout}>
              <button
                type="submit"
                aria-label="ออกจากระบบ"
                className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-red-500/10 hover:text-red-600 motion-reduce:transition-none dark:text-zinc-400 dark:hover:text-red-400 ${focusRing}`}
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
