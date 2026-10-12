import type { Metadata } from "next";
import Link from "next/link";
import { Film, Search, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { genreWhere, getGenreCounts } from "@/lib/catalog";
import { getI18n } from "@/lib/i18n/server";
import { formatNumber, formatRating, truncateText } from "@/lib/format";
import { tmdbImage } from "@/lib/tmdb-image";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import Pagination from "@/components/pagination";
import FavoriteButton from "@/components/favorite-button";
import { MovieBillingCard } from "@/components/movie-billing-card";
import { Face, focusRing, goldLink } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.movies.metaTitle} | Hollywood Hub` };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

type SearchParams = Promise<{
  q?: string;
  genre?: string;
  sort?: string;
  view?: string;
  page?: string;
}>;

/** ?sort= → ลำดับการแสดงผล (เมนู "หนังใหม่" / "ยอดนิยม" ใน navbar ลิงก์มาที่นี่) */
const SORTS = {
  rating: { orderBy: [{ rating: "desc" }, { vote_count: "desc" }] },
  new: { orderBy: [{ release_date: "desc" }, { id: "desc" }] },
  popular: { orderBy: [{ popularity: "desc" }, { id: "asc" }] },
} satisfies Record<string, { orderBy: Prisma.moviesOrderByWithRelationInput[] }>;
type SortKey = keyof typeof SORTS;
const isSort = (v: unknown): v is SortKey => typeof v === "string" && Object.hasOwn(SORTS, v);

/** ลิงก์ตัวกรองแบบข้อความ: เลือกอยู่ = ทองขีดเส้นใต้ (เหมือนหน้าดารา) */
const filterLink = (active: boolean) =>
  `whitespace-nowrap rounded-sm transition-colors ${focusRing} ${
    active ? "text-gold-light underline decoration-gold underline-offset-[6px]" : "text-cream/70 hover:text-cream"
  }`;


export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, { t, locale }] = await Promise.all([searchParams, getI18n()]);
  // เรื่องย่อตามภาษา (ภาษาอังกฤษไม่มี → ใช้ที่มี)
  const overviewOf = (m: { overview: string | null; overview_en: string | null }) =>
    locale === "en" ? (m.overview_en ?? m.overview) : m.overview;
  const q = params.q?.trim().slice(0, 100) ?? "";
  const genre = params.genre?.trim() ?? "";
  const sort: SortKey = isSort(params.sort) ? params.sort : "rating";
  const view = params.view === "list" ? "list" : "grid";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const hasFilter = Boolean(q || genre);

  // "หนังใหม่" แสดงเฉพาะเรื่องที่เข้าฉายแล้ว
  const where: Prisma.moviesWhereInput = {
    AND: [
      q ? { title: { contains: q } } : {},
      genre ? genreWhere(genre) : {},
      sort === "new" ? { release_date: { lte: new Date() } } : {},
    ],
  };

  const [total, genreCounts] = await Promise.all([prisma.movies.count({ where }), getGenreCounts()]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const movies = await prisma.movies.findMany({
    where,
    orderBy: SORTS[sort].orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    select: {
      id: true,
      title: true,
      release_year: true,
      release_date: true,
      genre: true,
      poster_url: true,
      rating: true,
      runtime: true,
      overview: true,
      overview_en: true,
      cast: {
        orderBy: { billing_order: "asc" },
        take: 3,
        select: { role_name: true, actor: { select: { id: true, name: true, avatar_url: true } } },
      },
    },
  });

  /** ลิงก์ที่คงตัวกรองเดิมไว้ เปลี่ยนเฉพาะค่าที่ส่งมา */
  const hrefWith = (patch: Record<string, string>) => {
    const sp = new URLSearchParams();
    const merged = {
      q,
      genre,
      sort: sort === "rating" ? "" : sort,
      view: view === "grid" ? "" : view,
      ...patch,
    };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/movies?${qs}` : "/movies";
  };

  const showRank = sort === "popular" && !hasFilter;
  const rankOf = (i: number) => (page - 1) * PAGE_SIZE + i + 1;
  const sortText = t.movies.sorts[sort];
  const heading = genre ? t.movies.genreHeading(t.common.genre(genre)) : sortText.title;

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        {/* ═══════ หัวหน้า + ค้นหา ═══════ */}
        <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            {genre && (
              <Link href="/genres" className={`mb-4 inline-block text-sm ${goldLink}`}>
                {t.movies.backToGenres}
              </Link>
            )}
            <h1 className="font-editorial text-5xl leading-[1.15] text-cream sm:text-6xl">{heading}</h1>
            <p className="mt-4 max-w-xl text-cream/70">
              {genre ? t.movies.genreIntro(t.common.genre(genre), genre, sortText.label) : sortText.intro}
            </p>
          </div>
          <form action="/movies" method="get" role="search" className="flex items-end gap-3 lg:col-span-5">
            {genre && <input type="hidden" name="genre" value={genre} />}
            {sort !== "rating" && <input type="hidden" name="sort" value={sort} />}
            {view === "list" && <input type="hidden" name="view" value="list" />}
            <label htmlFor="movie-q" className="sr-only">
              {t.movies.searchLabel}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="movie-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder={t.movies.searchPlaceholder}
                className="h-12 w-full border-0 border-b border-gold-dark bg-transparent pl-7 pr-1 text-lg text-cream placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </div>
            <button type="submit" className={`h-11 rounded-[4px] bg-gold-gradient px-5 text-sm font-medium text-ink ${focusRing}`}>
              {t.common.search}
            </button>
          </form>
        </header>

        {/* ═══════ ตัวกรอง (ข้อความล้วน แบบสารบัญ) ═══════ */}
        <div className="mt-12 space-y-4 border-y border-line py-5 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <nav aria-label={t.common.sortLabel} className="flex gap-x-5 gap-y-2 overflow-x-auto scrollbar-none sm:flex-wrap">
              <span className="shrink-0 text-muted">{t.common.sortBy}</span>
              {(["new", "popular", "rating"] as const).map((key) => (
                <Link
                  key={key}
                  href={hrefWith({ sort: key === "rating" ? "" : key, page: "" })}
                  aria-current={sort === key ? "true" : undefined}
                  className={filterLink(sort === key)}
                >
                  {t.movies.sorts[key].label}
                </Link>
              ))}
            </nav>
            <nav aria-label={t.common.viewMode} className="flex gap-x-5">
              <span className="text-muted">{t.common.viewAs}</span>
              <Link href={hrefWith({ view: "" })} aria-current={view === "grid" ? "true" : undefined} className={filterLink(view === "grid")}>
                {t.common.grid}
              </Link>
              <Link href={hrefWith({ view: "list" })} aria-current={view === "list" ? "true" : undefined} className={filterLink(view === "list")}>
                {t.common.list}
              </Link>
            </nav>
          </div>
          <nav aria-label={t.movies.byGenre} className="flex gap-x-5 gap-y-2 overflow-x-auto scrollbar-none sm:flex-wrap">
            <span className="shrink-0 text-muted">{t.movies.genre}</span>
            <Link href={hrefWith({ genre: "", page: "" })} aria-current={!genre ? "true" : undefined} className={filterLink(!genre)}>
              {t.movies.allGenres}
            </Link>
            {genreCounts.map((g) => (
              <Link
                key={g.genre}
                href={hrefWith({ genre: g.genre, page: "" })}
                aria-current={genre === g.genre ? "true" : undefined}
                className={filterLink(genre === g.genre)}
              >
                {t.common.genre(g.genre)} <span className="text-xs text-muted">{g.count}</span>
              </Link>
            ))}
          </nav>
        </div>

        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {t.common.found(total, "movies")[0]}
          <span className="text-gold-light">{formatNumber(total)}</span>
          {t.common.found(total, "movies")[1]}
          {q && <> {t.common.nameContains} &ldquo;{q}&rdquo;</>}
          {hasFilter && (
            <Link href={hrefWith({ q: "", genre: "", page: "" })} className={`ml-4 ${goldLink}`}>
              {t.common.clearFilters}
            </Link>
          )}
          {totalPages > 1 && <span className="ml-4">{t.common.pageOf(page, totalPages)}</span>}
        </p>

        {movies.length === 0 ? (
          <div className="mt-10 border-y border-line py-16 text-center">
            <Film className="mx-auto h-8 w-8 text-muted" aria-hidden />
            <p className="mt-4 font-editorial text-2xl text-cream">{t.movies.emptyTitle}</p>
            <p className="mt-2 text-sm text-muted">{t.movies.emptyHint}</p>
            <Link href="/movies" className={`mt-6 inline-block text-sm ${goldLink}`}>
              {t.movies.seeAll}
            </Link>
          </div>
        ) : view === "grid" ? (
          /* ═══════ แบบภาพ: ใบปิด + รายชื่อดารานำ ═══════ */
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-12 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {movies.map((movie, i) => (
              <li key={movie.id} className="min-w-0">
                <MovieBillingCard movie={movie} rank={showRank ? rankOf(i) : undefined} priority={i < 6} />
              </li>
            ))}
          </ul>
        ) : (
          /* ═══════ แบบรายการ: ตารางเหมือนทำเนียบ ═══════ */
          <ol className="mt-6 border-t border-line">
            {movies.map((movie, i) => {
              const rating = movie.rating === null ? null : Number(movie.rating.toString());
              return (
                <li
                  key={movie.id}
                  className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]"
                >
                  <div className="flex min-w-0 gap-5">
                    {showRank && (
                      <span aria-hidden className="w-10 shrink-0 pt-1 text-right font-editorial text-3xl italic leading-none text-gold-light tabular-nums">
                        {rankOf(i)}
                      </span>
                    )}
                    <Link href={`/movies/${movie.id}`} tabIndex={-1} aria-hidden className="relative block aspect-[2/3] w-16 shrink-0 overflow-hidden bg-surface ring-1 ring-line sm:w-20">
                      {movie.poster_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tmdbImage(movie.poster_url, "w185") ?? undefined} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start gap-3">
                        <h2 className="font-editorial text-2xl text-cream">
                          {showRank && <span className="sr-only">{t.common.rank(rankOf(i))} </span>}
                          <Link href={`/movies/${movie.id}`} className={`rounded-sm hover:text-gold-light ${focusRing}`}>
                            {movie.title}
                          </Link>
                        </h2>
                        <FavoriteButton
                          kind="movie"
                          variant="icon"
                          className="ml-auto"
                          item={{ id: movie.id, title: movie.title, poster_url: movie.poster_url, rating, year: movie.release_year }}
                        />
                      </div>
                      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                        <span>{movie.release_date ? t.date.short(movie.release_date) : (movie.release_year ?? t.movies.noYear)}</span>
                        {movie.genre && <span>{movie.genre.split(",").map((g) => t.common.genre(g.trim())).join(", ")}</span>}
                        {movie.runtime ? <span>{t.movies.minutes(movie.runtime)}</span> : null}
                        {rating !== null && (
                          <span className="inline-flex items-center gap-1 text-cream/80">
                            <Star className="h-3.5 w-3.5 fill-gold text-gold" aria-hidden />
                            {formatRating(movie.rating)}
                            <span className="sr-only">{t.common.outOf10}</span>
                          </span>
                        )}
                      </p>
                      {overviewOf(movie) && (
                        <p className="mt-3 max-w-[70ch] text-[15px] leading-7 text-cream/70">{truncateText(overviewOf(movie)!, 220)}</p>
                      )}
                    </div>
                  </div>

                  {movie.cast.length > 0 && (
                    <div className="min-w-0 md:pt-1">
                      <p className="text-xs text-muted">{t.common.starringLabel}</p>
                      <ul className="mt-2 divide-y divide-line border-y border-line">
                        {movie.cast.map(({ actor, role_name }) => (
                          <li key={actor.id}>
                            <Link
                              href={`/actors/${actor.id}`}
                              className={`flex items-center gap-3 py-2.5 transition-colors hover:bg-surface ${focusRing}`}
                            >
                              <Face name={actor.name} url={actor.avatar_url} className="h-9 w-9" size="w92" />
                              <span className="min-w-0">
                                <span className="block truncate font-editorial text-[15px] text-cream">{actor.name}</span>
                                {role_name && <span className="block truncate text-xs text-muted">{t.common.asRole(role_name)}</span>}
                              </span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/movies"
          params={{ q, genre, sort: sort === "rating" ? "" : sort, view: view === "grid" ? "" : view }}
        />
      </main>

      <SiteFooter />
    </>
  );
}
