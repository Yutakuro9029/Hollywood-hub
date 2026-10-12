import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getGenreOverview } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { formatNumber } from "@/lib/format";
import { tmdbImage } from "@/lib/tmdb-image";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import { Face, SectionHead, focusRing } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.genres.metaTitle} | Hollywood Hub` };
}
export const dynamic = "force-dynamic";

/** หน้าเลือกหมวดหมู่ล้วน ๆ: กดแนวหนังแล้วไปหน้ารายการหนัง (/movies?genre=…) */
export default async function GenresPage() {
  const [genres, totalMovies, { t, locale }] = await Promise.all([
    getGenreOverview(),
    prisma.movies.count(),
    getI18n(),
  ]);

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        {/* ═══════ หัวหน้า ═══════ */}
        <header className="grid gap-6 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <h1 className="font-editorial text-5xl leading-[1.15] text-cream sm:text-6xl">{t.genres.title}</h1>
            <p className="mt-4 max-w-xl text-cream/70">
              {t.genres.intro}
            </p>
          </div>
          <dl className="flex gap-10 lg:col-span-4 lg:justify-end">
            <div>
              <dt className="text-xs text-muted">{t.genres.statGenres}</dt>
              <dd className="font-editorial text-4xl text-gold-light tabular-nums">{genres.length}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">{t.genres.statMovies}</dt>
              <dd className="font-editorial text-4xl text-gold-light tabular-nums">{formatNumber(totalMovies)}</dd>
            </div>
          </dl>
        </header>

        {/* ═══════ ทุกแนวหนัง ═══════ */}
        <section aria-labelledby="genre-title" className="mt-16">
          <SectionHead id="genre-title" title={t.genres.allGenres} description={t.genres.allGenresDesc} />
          <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {genres.map((g, i) => {
              const featured = i === 0;
              const img = g.cover ? tmdbImage(g.cover.backdrop_url ?? g.cover.poster_url, featured ? "w1280" : "w780") : null;
              return (
                <li key={g.genre} className={featured ? "sm:col-span-2 lg:row-span-2" : ""}>
                  <Link
                    href={`/movies?genre=${encodeURIComponent(g.genre)}`}
                    className={`group relative isolate flex h-full flex-col justify-end overflow-hidden bg-surface p-5 ring-1 ring-inset ring-line transition hover:ring-gold sm:p-6 ${
                      featured ? "min-h-80 lg:min-h-[32rem]" : "min-h-60"
                    } ${focusRing}`}
                  >
                    {img && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={img}
                        alt=""
                        loading={i < 4 ? "eager" : "lazy"}
                        decoding="async"
                        className="absolute inset-0 -z-10 h-full w-full object-cover brightness-[.55] grayscale transition duration-700 ease-premium group-hover:scale-[1.03] group-hover:brightness-[.7] group-hover:grayscale-0 motion-reduce:transition-none"
                      />
                    )}
                    <span aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/10" />

                    <span className="flex items-baseline gap-3 text-xs text-muted">
                      <span className="font-editorial text-sm text-gold-light tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                      {locale === "th" && <span lang="en" className="uppercase tracking-[0.2em]">{g.genre}</span>}
                    </span>
                    <span
                      className={`mt-1 block font-editorial leading-tight text-cream transition-colors group-hover:text-gold-light ${
                        featured ? "text-5xl sm:text-6xl" : "text-4xl"
                      }`}
                    >
                      {t.common.genre(g.genre)}
                    </span>
                    <span className="mt-1 text-sm text-cream/75">{t.common.films(g.count)}</span>

                    {g.actors.length > 0 && (
                      <span className="mt-5 flex items-center gap-3 border-t border-line/80 pt-4">
                        <span aria-hidden className="flex shrink-0 -space-x-2">
                          {g.actors.map((a) => (
                            <Face key={a.id} name={a.name} url={a.avatar_url} className="h-8 w-8" size="w92" />
                          ))}
                        </span>
                        <span className="min-w-0 text-xs text-cream/70">
                          <span className="text-muted">{t.genres.frequent}</span>
                          <span className="line-clamp-1">{g.actors.map((a) => a.name).join(", ")}</span>
                        </span>
                      </span>
                    )}
                    {featured && g.cover && (
                      <span className="mt-3 text-xs text-muted">{t.genres.imageFrom(g.cover.title)}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
