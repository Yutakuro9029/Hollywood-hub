import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import AdminNav from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงเช็กซ้ำใน page แต่ละหน้าด้วย
  const session = await requireAdmin();

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-slate-900 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-6">
          <span className="text-lg font-bold text-amber-400">🎬 Admin Panel</span>
          <form action={logout} className="md:hidden">
            <button className="rounded-lg p-2 text-zinc-400 hover:text-red-400" aria-label="Logout">
              <LogOut size={18} />
            </button>
          </form>
        </div>

        <AdminNav />

        <form action={logout} className="mt-auto hidden border-t border-zinc-800 p-4 md:block">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition hover:bg-red-500/10 hover:text-red-400">
            <LogOut size={18} /> ออกจากระบบ
          </button>
        </form>
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
