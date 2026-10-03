import Link from "next/link";
import { LayoutDashboard, LogIn, LogOut, User } from "lucide-react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { logout } from "@/app/actions/auth";

const primaryBtn =
  "inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200";

const outlineBtn =
  "inline-flex items-center gap-2 rounded-lg border border-amber-500/70 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/60 dark:text-amber-300";

const logoutBtn =
  "inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-700 transition hover:border-red-400 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-red-400 dark:hover:text-red-400";

export default async function AuthActions() {
  const session = await getSession();

  // ดึงข้อมูลล่าสุดจาก DB: ได้ username และเช็กว่า user ยังมีอยู่/role ไม่ถูกเปลี่ยนหลังออก token
  const user = session
    ? await prisma.users.findUnique({
        where: { id: session.userId },
        select: { username: true, role: true },
      })
    : null;

  if (!user) {
    return (
      <Link href="/login" className={outlineBtn}>
        <LogIn className="h-4 w-4" aria-hidden />
        เข้าสู่ระบบ
      </Link>
    );
  }

  return (
    <>
      {user.role === "ADMIN" ? (
        <Link href="/admin" className={primaryBtn}>
          <LayoutDashboard className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">เข้าสู่ระบบหลังบ้าน</span>
          <span className="sm:hidden">หลังบ้าน</span>
        </Link>
      ) : (
        <span className="inline-flex max-w-32 items-center gap-2 px-2 text-sm font-medium text-zinc-700 sm:max-w-48 dark:text-zinc-300">
          <User
            className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
            aria-hidden
          />
          <span className="truncate">{user.username}</span>
        </span>
      )}

      <form action={logout}>
        <button type="submit" className={logoutBtn} aria-label="ออกจากระบบ">
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">ออกจากระบบ</span>
        </button>
      </form>
    </>
  );
}
