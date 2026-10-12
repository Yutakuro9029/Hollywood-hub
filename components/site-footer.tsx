import Link from "next/link";
import { getI18n } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";

const linkGroups = (t: Dict) => [
  {
    title: t.footer.stars,
    links: [
      { href: "/actors", label: t.footer.allStars },
      { href: "/actors?nationality=USA", label: t.footer.usStars },
      { href: "/actors?nationality=South%20Korea", label: t.footer.krStars },
      { href: "/actors?nationality=United%20Kingdom", label: t.footer.ukStars },
    ],
  },
  {
    title: t.footer.movies,
    links: [
      { href: "/movies?sort=new", label: t.nav.newMovies },
      { href: "/movies?sort=popular", label: t.nav.popular },
      { href: "/movies?sort=rating", label: t.footer.topRated },
      { href: "/genres", label: t.footer.allGenres },
    ],
  },
  {
    title: t.footer.site,
    links: [
      { href: "/watchlist", label: t.nav.mine },
      { href: "/login", label: t.nav.login },
      { href: "/about", label: t.footer.about },
    ],
  },
];

/* ไอคอนโซเชียล (lucide ไม่มีโลโก้แบรนด์ จึงใช้ SVG path อย่างง่าย) — เปลี่ยน href เป็นเพจจริงของโปรเจกต์ */
const SOCIALS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/",
    path: "M14 8h3V4h-3c-2.8 0-4.5 1.7-4.5 4.6V11H7v4h2.5v9h4v-9h3l.5-4h-3.5V8.8c0-.5.3-.8.5-.8Z",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/",
    path: "M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm4.9-8.9a1.1 1.1 0 1 0 0 2.2 1.1 1.1 0 0 0 0-2.2ZM12 2c-2.7 0-3 0-4.1.1C4.3 2.2 2.2 4.3 2.1 7.9 2 9 2 9.3 2 12s0 3 .1 4.1c.1 3.6 2.2 5.7 5.8 5.8 1.1.1 1.4.1 4.1.1s3 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15 2 14.7 2 12 2Zm0 1.8c2.7 0 3 0 4 .1 2.5.1 3.9 1.4 4 4 .1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.6-1.5 3.9-4 4-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.6-.1-3.9-1.5-4-4-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-2.6 1.4-3.9 4-4 1-.1 1.3-.1 4-.1Z",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/",
    path: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8ZM9.7 15V9l5.8 3-5.8 3Z",
  },
] as const;

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-black";

export default async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="mt-24 bg-black">
      <div className="rule-gold" aria-hidden />
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-10">
        <div className="max-w-sm">
          <Link href="/" className={`inline-block rounded-sm ${focusRing}`}>
            <span className="font-display text-2xl font-semibold tracking-[0.18em] text-gold-gradient">
              HOLLYWOOD HUB
            </span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted">
            {t.footer.tagline}
          </p>
          <ul className="mt-6 flex gap-3" aria-label={t.footer.follow}>
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className={`flex h-10 w-10 items-center justify-center rounded-[4px] border border-line text-muted transition-colors hover:border-gold-dark hover:text-gold-light ${focusRing}`}
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
                    <path d={s.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>

        {linkGroups(t).map((group) => (
          <nav key={group.title} aria-label={group.title}>
            <h2 className="font-serif text-sm font-semibold text-cream">{group.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {group.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`rounded-sm text-sm text-muted transition-colors hover:text-gold-light ${focusRing}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* เครดิต TMDB (เงื่อนไขการใช้ API) */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-xs leading-relaxed text-muted sm:px-6 md:flex-row md:items-center md:justify-between lg:px-10">
          <p>
            {t.footer.dataFrom}{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className={`rounded-sm text-gold-light underline decoration-gold-dark underline-offset-4 hover:decoration-gold ${focusRing}`}
            >
              TMDB
            </a>{" "}
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
          <p className="flex gap-4">
            <span>© {new Date().getFullYear()} Hollywood Hub</span>
            <Link href="/about" className={`rounded-sm hover:text-gold-light ${focusRing}`}>
              {t.footer.education}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
