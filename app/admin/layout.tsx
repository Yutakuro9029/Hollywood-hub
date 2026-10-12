import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { logout } from "@/app/actions/auth";
import AdminNav from "@/components/admin/admin-nav";
import LanguageSwitch from "@/components/language-switch";
import { getI18n } from "@/lib/i18n/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงเช็กซ้ำใน page แต่ละหน้าด้วย
  const [session, { t }] = await Promise.all([requireAdmin(), getI18n()]);

  return (
    <div className="min-h-screen bg-ink text-cream md:flex">
      <aside className="border-b border-line bg-ink md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-3 md:block md:px-6 md:pb-6 md:pt-7">
          <Link href="/" className="rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light">
            <span className="font-editorial text-xl italic text-gold-light">Hollywood Hub</span>
          </Link>
          <p className="hidden text-xs text-muted md:mt-1 md:block">{t.admin.label}</p>
          <div className="flex items-center gap-3 md:hidden">
            <LanguageSwitch />
            <form action={logout}>
              <button className="rounded-sm p-2 text-muted hover:text-cream" aria-label={t.nav.logout}>
                <LogOut size={18} />
              </button>
            </form>
          </div>
        </div>

        <AdminNav />

        <div className="mt-auto hidden border-t border-line px-6 py-4 md:block">
          <LanguageSwitch className="mb-3" />
          <p className="truncate text-xs text-muted">{t.nav.loggedInAs(session.username)}</p>
          <form action={logout} className="mt-2">
            <button className="flex items-center gap-2 rounded-sm text-sm text-cream/70 transition hover:text-cream focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light">
              <LogOut size={16} aria-hidden /> {t.nav.logout}
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-10 md:py-10">{children}</main>
    </div>
  );
}
