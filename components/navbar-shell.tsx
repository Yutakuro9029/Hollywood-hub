"use client";

import { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bookmark, LayoutDashboard, LogIn, LogOut, Menu, Search, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useFavorites } from "@/lib/use-favorites";
import { useI18n } from "@/lib/i18n/client";
import LanguageSwitch from "@/components/language-switch";

type NavKey = "home" | "new" | "popular" | "browse" | "actors" | "mine";

/** ข้อความเมนูมาจาก t.nav ตามคีย์ */
const NAV: { key: NavKey; href: string; label: "home" | "actors" | "newMovies" | "popular" | "genres" | "mine" }[] = [
  // เว็บเน้นดาราเป็นหลัก — เมนูดาราอยู่ถัดจากหน้าแรก
  { key: "home", href: "/", label: "home" },
  { key: "actors", href: "/actors", label: "actors" },
  { key: "new", href: "/movies?sort=new", label: "newMovies" },
  { key: "popular", href: "/movies?sort=popular", label: "popular" },
  { key: "browse", href: "/genres", label: "genres" },
  { key: "mine", href: "/watchlist", label: "mine" },
];

/**
 * เมนูไหนตรงกับหน้าปัจจุบัน — /movies ใช้ ?sort= แยก "หนังใหม่" / "ยอดนิยม"
 * "หมวดหมู่" = หน้า /genres หรือ /movies ที่กรองแนวหนัง (มาจากหน้าหมวดหมู่) เท่านั้น
 * /movies เฉย ๆ (ภาพยนตร์ทั้งหมด) ไม่ไฮไลต์เมนูไหน
 */
function activeKey(pathname: string, sort: string | null, genre: string | null): NavKey | null {
  if (pathname === "/") return "home";
  if (pathname.startsWith("/watchlist")) return "mine";
  if (pathname.startsWith("/actors")) return "actors";
  if (pathname === "/genres") return "browse";
  if (pathname === "/movies") {
    if (genre) return "browse";
    if (sort === "new") return "new";
    if (sort === "popular") return "popular";
  }
  return null;
}

/** เลื่อนลงจากบนสุดแล้วหรือยัง (ใช้ useSyncExternalStore แทน setState ใน effect) */
function subscribeScroll(onChange: () => void) {
  window.addEventListener("scroll", onChange, { passive: true });
  return () => window.removeEventListener("scroll", onChange);
}
const getScrolled = () => window.scrollY > 24;
const getScrolledServer = () => false;

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export default function NavbarShell({
  user,
  overlay,
}: {
  user: { username: string; role: "ADMIN" | "USER" } | null;
  overlay: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeKey(pathname, searchParams.get("sort"), searchParams.get("genre"));
  const { totalCount } = useFavorites();
  const { t } = useI18n();
  const menuId = useId();

  // โปร่งใสตอนอยู่บนสุดของ hero → ดำทึบ + blur เมื่อเลื่อนลง
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getScrolledServer);
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  // เมนูมือถือ: กด Esc เพื่อปิด
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const solid = !overlay || scrolled || menuOpen;

  return (
    <header
      className={`${overlay ? "fixed" : "sticky"} inset-x-0 top-0 z-50 transition-[background-color,backdrop-filter,border-color] duration-300 motion-reduce:transition-none ${
        solid
          ? "border-b border-line bg-ink/95 backdrop-blur-md"
          : "border-b border-transparent bg-gradient-to-b from-ink/80 to-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6 lg:px-8 xl:gap-6 xl:px-10">
        {/* โลโก้: ตัวอักษร Bodoni Moda แบบหัวนิตยสาร (ฟอนต์เดียวกับหัวข้อหน้าแรก) */}
        <Link href="/" className={`shrink-0 rounded-sm ${focusRing}`} aria-label={t.nav.logoLabel}>
          <span className="whitespace-nowrap font-editorial text-2xl italic text-gold-light">
            Hollywood Hub
          </span>
        </Link>

        {/* เมนูหลัก (จอใหญ่) */}
        <nav aria-label={t.nav.mainMenu} className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map((item) => (
              <li key={item.key}>
                <Link
                  href={item.href}
                  aria-current={active === item.key ? "page" : undefined}
                  className={`relative block whitespace-nowrap rounded-sm px-2.5 py-2 text-[15px] transition-colors xl:px-3 ${focusRing} ${
                    active === item.key ? "text-gold-light" : "text-cream/70 hover:text-cream"
                  }`}
                >
                  {t.nav[item.label]}
                  {item.key === "mine" && totalCount > 0 && (
                    <span className="ml-1.5 text-xs text-gold-light" aria-label={t.nav.itemsCount(totalCount)}>
                      ({totalCount})
                    </span>
                  )}
                  {active === item.key && (
                    <span aria-hidden className="absolute inset-x-2.5 -bottom-px h-px bg-gold xl:inset-x-3" />
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {/* ค้นหา */}
          {/* จอกลาง: ไอคอนค้นหา (ช่องเต็มกินที่จนเมนูตกบรรทัด) */}
          <Link
            href="/search"
            aria-label={t.nav.searchLabel}
            className={`hidden h-9 w-9 items-center justify-center rounded-[4px] text-cream/80 hover:text-gold-light lg:inline-flex xl:hidden ${focusRing}`}
          >
            <Search className="h-4 w-4" aria-hidden />
          </Link>
          <form action="/search" method="get" role="search" className="relative hidden xl:block">
            <label htmlFor="nav-search" className="sr-only">
              {t.nav.searchLabel}
            </label>
            <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
            <input
              id="nav-search"
              name="q"
              type="search"
              placeholder={t.nav.searchLabel}
              defaultValue={pathname === "/search" ? (searchParams.get("q") ?? "") : ""}
              className="h-9 w-52 border-0 border-b border-line bg-transparent pl-6 pr-1 text-sm text-cream placeholder:text-muted transition-[width,border-color] duration-300 focus:w-64 focus:border-gold focus:outline-none motion-reduce:transition-none"
            />
          </form>

          <LanguageSwitch className="hidden sm:flex" />

          {/* ผู้ใช้ */}
          {user ? (
            <div className="hidden items-center gap-1 md:flex">
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  aria-label={t.nav.adminDashboard}
                  title={t.nav.adminDashboard}
                  className={`inline-flex h-9 items-center gap-2 rounded-[4px] px-3 text-sm text-cream/80 hover:text-gold-light ${focusRing}`}
                >
                  <LayoutDashboard className="h-4 w-4" aria-hidden />
                  <span className="hidden whitespace-nowrap 2xl:inline">{t.nav.admin}</span>
                </Link>
              )}
              <span className="hidden max-w-32 truncate px-2 text-sm text-muted 2xl:inline" title={user.username}>
                {user.username}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  aria-label={t.nav.logoutAs(user.username)}
                  title={t.nav.logoutAs(user.username)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-[4px] text-cream/70 hover:text-cream ${focusRing}`}
                >
                  <LogOut className="h-4 w-4" aria-hidden />
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className={`hidden h-9 items-center gap-2 rounded-sm px-1 text-sm text-gold-light underline decoration-gold-dark underline-offset-[6px] transition-colors hover:decoration-gold md:inline-flex ${focusRing}`}
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {t.nav.login}
            </Link>
          )}

          {/* แฮมเบอร์เกอร์ (จอเล็ก) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-expanded={menuOpen}
            aria-controls={menuId}
            aria-label={menuOpen ? t.nav.closeMenu : t.nav.openMenu}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-[4px] text-cream lg:hidden ${focusRing}`}
          >
            {menuOpen ? <X className="h-5 w-5" aria-hidden /> : <Menu className="h-5 w-5" aria-hidden />}
          </button>
        </div>
      </div>

      {/* เมนูมือถือ */}
      {menuOpen && (
        <div id={menuId} className="animate-fade-slide border-t border-line bg-ink lg:hidden">
          <div className="mx-auto max-w-[1400px] px-4 pb-6 pt-4 sm:px-6">
            <form action="/search" method="get" role="search" onSubmit={closeMenu} className="relative">
              <label htmlFor="nav-search-mobile" className="sr-only">
                {t.nav.searchLabel}
              </label>
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="nav-search-mobile"
                name="q"
                type="search"
                placeholder={t.nav.searchLabel}
                className="h-12 w-full border-0 border-b border-gold-dark bg-transparent pl-7 pr-1 text-lg text-cream placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </form>

            <nav aria-label={t.nav.mainMenuMobile} className="mt-3">
              <ul className="divide-y divide-line">
                {NAV.map((item) => (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={closeMenu}
                      aria-current={active === item.key ? "page" : undefined}
                      className={`flex items-center justify-between py-3.5 text-base ${focusRing} ${
                        active === item.key ? "text-gold-light" : "text-cream"
                      }`}
                    >
                      {t.nav[item.label]}
                      {item.key === "mine" && totalCount > 0 && (
                        <span className="inline-flex items-center gap-1 text-sm text-gold-light">
                          <Bookmark className="h-3.5 w-3.5" fill="currentColor" aria-hidden />
                          {totalCount}
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="mt-4 flex items-center justify-between border-t border-line pt-4 sm:hidden">
              <span className="text-sm text-muted">{t.common.language}</span>
              <LanguageSwitch className="text-sm" />
            </div>

            <div className="mt-4 border-t border-line pt-4 md:hidden">
              {user ? (
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-muted">{t.nav.loggedInAs(user.username)}</span>
                  <div className="flex items-center gap-2">
                    {user.role === "ADMIN" && (
                      <Link href="/admin" onClick={closeMenu} className={`rounded-[4px] border border-line px-3 py-2 text-sm text-cream ${focusRing}`}>
                        {t.nav.admin}
                      </Link>
                    )}
                    <form action={logout}>
                      <button type="submit" className={`rounded-[4px] border border-line px-3 py-2 text-sm text-cream ${focusRing}`}>
                        {t.nav.logout}
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className={`flex h-11 items-center justify-center gap-2 rounded-[4px] border border-gold-dark text-gold-light ${focusRing}`}
                >
                  <LogIn className="h-4 w-4" aria-hidden />
                  {t.nav.login}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
