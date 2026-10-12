import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Search } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { actorCardInclude } from "@/lib/actor-include";
import { calcAge, formatRating, truncateText } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import Pagination from "@/components/pagination";
import FavoriteButton from "@/components/favorite-button";
import { ActorPortraitCard } from "@/components/actor-portrait-card";
import { Face, focusRing, goldLink } from "@/components/editorial";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.actors.metaTitle} | Hollywood Hub` };
}
export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

/** ?sort= → ลำดับรายชื่อดารา */
const SORTS = {
  awards: { orderBy: [{ awards_count: { sort: "desc", nulls: "last" } }, { name: "asc" }] },
  movies: { orderBy: [{ credits: { _count: "desc" } }, { name: "asc" }] },
  name: { orderBy: [{ name: "asc" }] },
  young: { orderBy: [{ birth_date: { sort: "desc", nulls: "last" } }, { name: "asc" }] },
  old: { orderBy: [{ birth_date: { sort: "asc", nulls: "last" } }, { name: "asc" }] },
} satisfies Record<string, { orderBy: Prisma.actorsOrderByWithRelationInput[] }>;
type SortKey = keyof typeof SORTS;
const isSort = (v: unknown): v is SortKey => typeof v === "string" && Object.hasOwn(SORTS, v);

type SearchParams = Promise<{ q?: string; nationality?: string; sort?: string; view?: string; page?: string }>;

/** ลิงก์ตัวกรองแบบข้อความ: เลือกอยู่ = ทองขีดเส้นใต้ */
const filterLink = (active: boolean) =>
  `whitespace-nowrap rounded-sm transition-colors ${focusRing} ${
    active ? "text-gold-light underline decoration-gold underline-offset-[6px]" : "text-cream/70 hover:text-cream"
  }`;

export default async function ActorsPage({ searchParams }: { searchParams: SearchParams }) {
  const [params, { t }] = await Promise.all([searchParams, getI18n()]);
  const q = params.q?.trim().slice(0, 100) ?? "";
  const nationality = params.nationality?.trim() ?? "";
  const sort: SortKey = isSort(params.sort) ? params.sort : "awards";
  const view = params.view === "list" ? "list" : "grid";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const hasFilter = Boolean(q || nationality);

  const where: Prisma.actorsWhereInput = {
    ...(q ? { name: { contains: q } } : {}),
    ...(nationality ? { nationality } : {}),
  };

  const [total, allCount, nationalityGroups] = await Promise.all([
    prisma.actors.count({ where }),
    prisma.actors.count(),
    prisma.actors.groupBy({
      by: ["nationality"],
      where: { nationality: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { nationality: "desc" } },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const actors = await prisma.actors.findMany({
    where,
    orderBy: SORTS[sort].orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: actorCardInclude,
  });

  /** ลิงก์ที่คงตัวกรองเดิมไว้ เปลี่ยนเฉพาะค่าที่ส่งมา */
  const hrefWith = (patch: Record<string, string>) => {
    const sp = new URLSearchParams();
    const merged = { q, nationality, sort: sort === "awards" ? "" : sort, view: view === "grid" ? "" : view, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const qs = sp.toString();
    return qs ? `/actors?${qs}` : "/actors";
  };

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1400px] px-4 pb-8 pt-14 sm:px-6 lg:px-10">
        {/* ═══════ หัวหน้า + ค้นหา ═══════ */}
        <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <h1 className="font-editorial text-5xl leading-[1.15] text-cream sm:text-6xl">
              {t.actors.title(nationality || null)}
            </h1>
            <p className="mt-4 max-w-xl text-cream/70">
              {t.common.statsIntro(allCount, nationalityGroups.length)}
            </p>
          </div>
          <form action="/actors" method="get" role="search" className="flex items-end gap-3 lg:col-span-5">
            {nationality && <input type="hidden" name="nationality" value={nationality} />}
            {sort !== "awards" && <input type="hidden" name="sort" value={sort} />}
            {view === "list" && <input type="hidden" name="view" value="list" />}
            <label htmlFor="actor-q" className="sr-only">
              {t.actors.searchLabel}
            </label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                id="actor-q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder={t.actors.searchPlaceholder}
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
          <nav aria-label={t.actors.byNationality} className="flex gap-x-5 gap-y-2 overflow-x-auto scrollbar-none sm:flex-wrap">
            <span className="shrink-0 text-muted">{t.actors.nationality}</span>
            <Link href={hrefWith({ nationality: "", page: "" })} aria-current={!nationality ? "page" : undefined} className={filterLink(!nationality)}>
              {t.actors.allNationalities} <span className="text-xs text-muted">{allCount}</span>
            </Link>
            {nationalityGroups.map((g) => (
              <Link
                key={g.nationality}
                href={hrefWith({ nationality: g.nationality!, page: "" })}
                aria-current={nationality === g.nationality ? "page" : undefined}
                className={filterLink(nationality === g.nationality)}
              >
                {g.nationality} <span className="text-xs text-muted">{g._count._all}</span>
              </Link>
            ))}
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
            <nav aria-label={t.common.sortLabel} className="flex gap-x-5 gap-y-2 overflow-x-auto scrollbar-none sm:flex-wrap">
              <span className="shrink-0 text-muted">{t.common.sortBy}</span>
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <Link
                  key={key}
                  href={hrefWith({ sort: key === "awards" ? "" : key, page: "" })}
                  aria-current={sort === key ? "true" : undefined}
                  className={filterLink(sort === key)}
                >
                  {t.actors.sorts[key]}
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
        </div>

        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {t.common.found(total, "actors")[0]}
          <span className="text-gold-light">{total}</span>
          {t.common.found(total, "actors")[1]}
          {q && <> {t.common.nameContains} &ldquo;{q}&rdquo;</>}
          {hasFilter && (
            <Link href="/actors" className={`ml-4 ${goldLink}`}>
              {t.common.clearFilters}
            </Link>
          )}
          {totalPages > 1 && <span className="ml-4">{t.common.pageOf(page, totalPages)}</span>}
        </p>

        {actors.length === 0 ? (
          <div className="mt-10 border-y border-line py-16 text-center">
            <p className="font-editorial text-2xl text-cream">{t.actors.emptyTitle}</p>
            <p className="mt-2 text-sm text-muted">{t.actors.emptyHint}</p>
            <Link href="/actors" className={`mt-6 inline-block text-sm ${goldLink}`}>
              {t.actors.seeAll}
            </Link>
          </div>
        ) : view === "grid" ? (
          /* ═══════ แบบภาพ: แฟ้มรูปนักแสดง ═══════ */
          <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {actors.map((actor, i) => (
              <li key={actor.id}>
                <ActorPortraitCard actor={{ ...actor, knownFor: actor.credits.map((c) => c.movie.title) }} priority={i < 6} />
              </li>
            ))}
          </ul>
        ) : (
          /* ═══════ แบบรายการ: ตารางเหมือนทำเนียบ ═══════ */
          <ul className="mt-6 border-t border-line">
            {actors.map((actor) => {
              const age = calcAge(actor.birth_date);
              return (
                <li
                  key={actor.id}
                  className="grid grid-cols-[minmax(0,1fr)] gap-x-8 gap-y-4 border-b border-line py-6 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]"
                >
                  <div className="flex min-w-0 gap-5">
                    <Link href={`/actors/${actor.id}`} tabIndex={-1} aria-hidden className="shrink-0">
                      <Face name={actor.name} url={actor.avatar_url} className="h-16 w-16 sm:h-20 sm:w-20" />
                    </Link>
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        <h2 className="font-editorial text-2xl text-cream">
                          <Link href={`/actors/${actor.id}`} className={`rounded-sm hover:text-gold-light ${focusRing}`}>
                            {actor.name}
                          </Link>
                        </h2>
                        <FavoriteButton
                          kind="actor"
                          variant="icon"
                          className="ml-auto"
                          item={{ id: actor.id, name: actor.name, avatar_url: actor.avatar_url, nationality: actor.nationality }}
                        />
                      </div>
                      <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                        <span>{actor.nationality ?? t.common.noNationality}</span>
                        {age !== null && <span>{t.common.age(age)}</span>}
                        <span className="text-gold-light">{t.common.awards(actor.awards_count)}</span>
                        <span>{t.common.moviesInSystem(actor._count.credits)}</span>
                      </p>
                      {actor.bio && (
                        <p lang="en" className="mt-3 max-w-[70ch] font-editorial text-[15px] leading-7 text-cream/75">
                          {truncateText(actor.bio, 240)}
                        </p>
                      )}
                    </div>
                  </div>

                  {actor.credits.length > 0 && (
                    <div className="min-w-0 md:pt-1">
                      <p className="text-xs text-muted">{t.actors.knownFor}</p>
                      <ul className="mt-2 divide-y divide-line border-y border-line">
                        {actor.credits.map(({ movie, role_name }) => (
                          <li key={movie.id}>
                            <Link
                              href={`/movies/${movie.id}`}
                              className={`grid grid-cols-[3rem_minmax(0,1fr)_auto] items-baseline gap-x-3 py-2.5 transition-colors hover:bg-surface ${focusRing}`}
                            >
                              <span className="font-editorial text-sm text-gold-light tabular-nums">{movie.release_year ?? "—"}</span>
                              <span className="min-w-0">
                                <span className="block truncate text-sm text-cream">{movie.title}</span>
                                {role_name && <span className="block truncate text-xs text-muted">{t.common.asRole(role_name)}</span>}
                              </span>
                              {movie.rating !== null && (
                                <span className="text-xs text-cream/70 tabular-nums" title={t.common.outOf10}>
                                  {formatRating(movie.rating)}
                                </span>
                              )}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <Pagination
          page={page}
          totalPages={totalPages}
          basePath="/actors"
          params={{ q, nationality, sort: sort === "awards" ? "" : sort, view: view === "grid" ? "" : view }}
        />
      </main>

      <SiteFooter />
    </>
  );
}
