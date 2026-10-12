import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { COURSE, TEAM } from "@/lib/team";
import { formatNumber, getInitials } from "@/lib/format";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import PromoAd from "@/components/promo-ad";
import PromoPopup from "@/components/promo-popup";
import { SectionHead } from "@/components/editorial";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.about.metaTitle} | Hollywood Hub` };
}
export const dynamic = "force-dynamic";

/** note = คีย์ใน t.about.stack (null = ชื่อฟีเจอร์ภาษาอังกฤษ ใช้ทั้งสองภาษา) */
const STACK = [
  { name: "Next.js 16", note: null },
  { name: "React 19 + TypeScript", note: "react" },
  { name: "Tailwind CSS 4", note: "tailwind" },
  { name: "Prisma + MySQL (MariaDB)", note: "prisma" },
  { name: "TMDB API + Wikidata", note: "tmdb" },
] as const;

export default async function AboutPage() {
  const [actorCount, movieCount, creditCount, { t, locale }] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movie_cast.count(),
    getI18n(),
  ]);
  const courseRows = COURSE.map((r) => ({ label: r.label[locale], value: r.value[locale], sub: r.sub?.[locale] })).filter((r) => r.value);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        {/* ═══════ หัวหน้า ═══════ */}
        <header className="max-w-3xl">
          <h1 className="font-editorial text-5xl leading-[1.15] text-cream sm:text-6xl">{t.about.title}</h1>
          <p className="mt-5 text-lg leading-relaxed text-cream/75">
            {t.about.intro}
          </p>
        </header>

        {/* ═══════ ทีมผู้จัดทำ: การ์ดแบบแฟ้มรูปนักแสดง ═══════ */}
        <section aria-labelledby="team-title" className="mt-16">
          <SectionHead id="team-title" title={t.about.team} description={t.about.members(TEAM.length)} />
          <ul className="mt-8 grid max-w-2xl grid-cols-2 gap-x-5 gap-y-10 sm:gap-x-8">
            {TEAM.map((m, i) => (
              <li key={`${m.studentId}-${i}`} className="group">
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo}
                      alt={t.about.photoOf(m.name)}
                      className="absolute inset-0 h-full w-full object-cover object-top brightness-[.85] grayscale transition duration-500 ease-premium group-hover:brightness-100 group-hover:grayscale-0 motion-reduce:transition-none"
                    />
                  ) : (
                    <span aria-hidden className="absolute inset-0 flex items-center justify-center font-editorial text-5xl text-gold-light">
                      {getInitials(m.name)}
                    </span>
                  )}
                  <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-line transition group-hover:ring-gold" />
                  <span aria-hidden className="absolute left-3 top-2 font-editorial text-sm italic text-gold-light/80 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>
                <h3 className="mt-3 font-editorial text-xl leading-snug text-cream">{m.name}</h3>
                <p className="mt-1 text-sm text-gold-light tabular-nums">
                  <span className="sr-only">{t.about.studentId} </span>
                  {m.studentId}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* ═══════ รายวิชา + โปรเจกต์ ═══════ */}
        <div className="mt-20 grid gap-16 lg:grid-cols-2">
          {courseRows.length > 0 && (
            <section aria-labelledby="course-title">
              <SectionHead id="course-title" title={t.about.course} />
              <dl className="mt-6 divide-y divide-line border-b border-line">
                {courseRows.map((r) => (
                  <div key={r.label} className="grid grid-cols-[8rem_minmax(0,1fr)] gap-4 py-3.5">
                    <dt className="text-sm text-muted">{r.label}</dt>
                    <dd className="text-cream">
                      {r.value}
                      {r.sub && <span className="block text-sm text-cream/60">{r.sub}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          <section aria-labelledby="project-title">
            <SectionHead id="project-title" title={t.about.project} />
            <dl className="mt-6 grid grid-cols-3 gap-px overflow-hidden rounded-[4px] border border-line bg-line">
              {[
                { label: t.about.statActors, value: actorCount, unit: t.about.unitPeople },
                { label: t.about.statMovies, value: movieCount, unit: t.about.unitFilms },
                { label: t.about.statRoles, value: creditCount, unit: t.about.unitRoles },
              ].map((s) => (
                <div key={s.label} className="bg-surface px-4 py-4">
                  <dt className="text-xs text-muted">{s.label}</dt>
                  <dd className="mt-1 font-editorial text-3xl text-cream tabular-nums">
                    {formatNumber(s.value)} <span className="font-sans text-xs text-muted">{s.unit}</span>
                  </dd>
                </div>
              ))}
            </dl>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {STACK.map((s) => (
                <li key={s.name} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3">
                  <span className="text-cream">{s.name}</span>
                  <span className="text-sm text-muted">{s.note ? t.about.stack[s.note] : "App Router, Server Components, Server Actions"}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-relaxed text-muted">
              {t.about.credit}
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
      <PromoAd />
      <PromoPopup />
    </>
  );
}
