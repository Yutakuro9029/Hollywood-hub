import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import { MovieCard } from "@/components/movie-card";
import { ActorCircle } from "@/components/actor-circle";
import { getI18n } from "@/lib/i18n/server";

export const dynamic = "force-dynamic";

const ACTOR_LIMIT = 12;
const MOVIE_LIMIT = 18;

type Props = { searchParams: Promise<{ q?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [{ q }, { t }] = await Promise.all([searchParams, getI18n()]);
  const term = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  return { title: `${t.search.metaTitle(term)} | Hollywood Hub` };
}

const linkCls =
  "shrink-0 rounded-sm pb-1 text-sm text-gold-light underline decoration-gold-dark underline-offset-[6px] hover:decoration-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light";

/** ค้นหาจากช่องค้นหาใน Navbar: แสดงทั้งดาราและภาพยนตร์ที่ชื่อตรงกัน */
export default async function SearchPage({ searchParams }: Props) {
  const [{ q: raw }, { t }] = await Promise.all([searchParams, getI18n()]);
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim().slice(0, 100) ?? "";

  const [actors, actorTotal, movies, movieTotal] = q
    ? await Promise.all([
        prisma.actors.findMany({
          where: { name: { contains: q } },
          orderBy: [{ awards_count: "desc" }, { name: "asc" }],
          take: ACTOR_LIMIT,
          select: {
            id: true,
            name: true,
            nationality: true,
            avatar_url: true,
            awards_count: true,
            _count: { select: { credits: true } },
          },
        }),
        prisma.actors.count({ where: { name: { contains: q } } }),
        prisma.movies.findMany({
          where: { title: { contains: q } },
          orderBy: [{ popularity: "desc" }, { id: "asc" }],
          take: MOVIE_LIMIT,
          select: { id: true, title: true, release_year: true, genre: true, poster_url: true, rating: true },
        }),
        prisma.movies.count({ where: { title: { contains: q } } }),
      ])
    : [[], 0, [], 0];

  const nothing = q && actorTotal === 0 && movieTotal === 0;

  return (
    <>
      <Navbar />
      <main className="mx-auto min-h-[60vh] max-w-[1400px] px-4 pt-12 sm:px-6 lg:px-10">
        <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
          {q ? <>{t.search.resultsFor} &ldquo;{q}&rdquo;</> : t.search.title}
        </h1>
        <span aria-hidden className="mt-4 block h-px w-12 bg-gold" />

        {/* ช่องค้นหาในหน้า (ใช้ได้บนมือถือโดยไม่ต้องเปิดเมนู) */}
        <form action="/search" method="get" role="search" className="mt-8 flex max-w-xl gap-3">
          <label htmlFor="search-q" className="sr-only">
            {t.search.label}
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={q}
            placeholder={t.search.label}
            className="h-12 flex-1 rounded-[4px] border border-line bg-surface px-4 text-cream placeholder:text-muted focus:border-gold-dark focus:outline-none"
          />
          <button
            type="submit"
            className="h-12 rounded-[4px] bg-gold-gradient px-6 font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            {t.common.search}
          </button>
        </form>

        {nothing && (
          <p className="mt-12 text-muted">
            {t.search.nothingBefore} &ldquo;{q}&rdquo; {t.search.nothingAfter}{" "}
            <Link href="/genres" className="text-gold-light underline decoration-gold-dark underline-offset-4">
              {t.search.browseGenres}
            </Link>
          </p>
        )}

        {actorTotal > 0 && (
          <section aria-labelledby="result-actors" className="mt-14">
            <div className="flex items-end justify-between gap-6">
              <h2 id="result-actors" className="font-serif text-xl font-semibold text-cream">
                {t.search.actors} <span className="text-base font-normal text-muted">{t.common.people(actorTotal)}</span>
              </h2>
              {actorTotal > ACTOR_LIMIT && (
                <Link href={`/actors?q=${encodeURIComponent(q)}`} className={linkCls}>
                  {t.actors.seeAll}
                </Link>
              )}
            </div>
            <ul className="mt-6 grid grid-cols-3 gap-x-4 gap-y-8 sm:grid-cols-4 md:grid-cols-6">
              {actors.map((actor) => (
                <li key={actor.id}>
                  <ActorCircle actor={actor} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {movieTotal > 0 && (
          <section aria-labelledby="result-movies" className="mt-14">
            <div className="flex items-end justify-between gap-6">
              <h2 id="result-movies" className="font-serif text-xl font-semibold text-cream">
                {t.search.movies} <span className="text-base font-normal text-muted">{t.common.films(movieTotal)}</span>
              </h2>
              {movieTotal > MOVIE_LIMIT && (
                <Link href={`/movies?q=${encodeURIComponent(q)}`} className={linkCls}>
                  {t.movies.seeAll}
                </Link>
              )}
            </div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {movies.map((movie) => (
                <li key={movie.id}>
                  <MovieCard movie={movie} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
