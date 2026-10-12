import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Film, Play, Star } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { genreWhere } from "@/lib/catalog";
import { splitGenres } from "@/lib/dashboard-format";
import { formatNumber, formatRating } from "@/lib/format";
import { cleanReviewParagraphs } from "@/lib/review-text";
import { tmdbImage } from "@/lib/tmdb-image";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import FavoriteButton from "@/components/favorite-button";
import TrailerEmbed from "@/components/trailer-embed";
import RowScroller from "@/components/row-scroller";
import { MovieRow, SectionHeader } from "@/components/row";
import { ActorCircle } from "@/components/actor-circle";
import { getI18n } from "@/lib/i18n/server";

/* ───────────────────────── Data ───────────────────────── */

type Props = { params: Promise<{ id: string }> };

/** ใช้ cache() เพื่อให้ generateMetadata และ page แชร์ผลการ query เดียวกันในหนึ่ง request */
const getMovie = cache((id: number) =>
  prisma.movies.findUnique({
    where: { id },
    include: {
      cast: {
        orderBy: { billing_order: "asc" },
        include: {
          actor: {
            select: { id: true, name: true, nationality: true, avatar_url: true, awards_count: true },
          },
        },
      },
      reviews: { orderBy: { written_at: "desc" } },
      providers: { orderBy: [{ priority: "asc" }, { provider_name: "asc" }] },
    },
  }),
);

const cardSelect = { id: true, title: true, release_year: true, genre: true, poster_url: true, rating: true } as const;

/** หนังที่คล้ายกัน: แนวหนังซ้ำกันมากที่สุดก่อน แล้วค่อยดูความนิยม */
async function getSimilar(movieId: number, genres: string[]) {
  if (genres.length === 0) return [];
  const candidates = await prisma.movies.findMany({
    where: { id: { not: movieId }, OR: genres.map((g) => genreWhere(g)) },
    orderBy: { popularity: "desc" },
    take: 80,
    select: { ...cardSelect, popularity: true },
  });
  const overlap = (g: string | null) => splitGenres(g).filter((x) => genres.includes(x)).length;
  return candidates
    .map((m) => ({ m, score: overlap(m.genre) }))
    .sort((a, b) => b.score - a.score || Number(b.m.popularity ?? 0) - Number(a.m.popularity ?? 0))
    .slice(0, 16)
    .map(({ m }) => m);
}

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 && n <= 4_294_967_295 ? n : null;
}

/* ───────────────────────── Format ───────────────────────── */

/** รายได้หน่วยล้านดอลลาร์ → "$2.93B" / "$836.8M" */
function formatGross(mil: number): string {
  return mil >= 1000 ? `$${(mil / 1000).toFixed(2)}B` : `$${formatNumber(Math.round(mil * 10) / 10)}M`;
}

const PROVIDER_KINDS = ["flatrate", "rent", "buy"] as const;

/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseId(id);
  const [movie, { locale, t }] = await Promise.all([movieId ? getMovie(movieId) : null, getI18n()]);
  if (!movie) return { title: `${t.movie.notFound} | Hollywood Hub` };

  const year = movie.release_year ? ` (${movie.release_year})` : "";
  const title = `${movie.title}${year} | Hollywood Hub`;
  const stars = movie.cast.slice(0, 3).map((c) => c.actor.name).join(", ");
  const overview = locale === "en" ? (movie.overview_en ?? movie.overview) : movie.overview;
  const description = overview?.slice(0, 160) ?? (stars ? t.movie.metaStarring(movie.title, stars) : movie.title);
  const image = tmdbImage(movie.backdrop_url, "w1280") ?? movie.poster_url;

  return { title, description, openGraph: { title, description, images: image ? [image] : undefined } };
}

/* ───────────────────────── UI pieces ───────────────────────── */

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

/** ดาว 5 ดวง เติมทองตามสัดส่วนคะแนน (เต็ม 10) */
function GoldStars({ value, label, size = "h-5 w-5" }: { value: number; label: string; size?: string }) {
  const pct = Math.max(0, Math.min(100, value * 10));
  const stars = Array.from({ length: 5 }, (_, i) => <Star key={i} className={`${size} shrink-0 fill-current`} aria-hidden />);
  return (
    <span className="relative inline-flex" role="img" aria-label={label}>
      <span className="flex gap-0.5 text-line">{stars}</span>
      <span className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-gold" style={{ width: `${pct}%` }}>
        {stars}
      </span>
    </span>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default async function MoviePage({ params }: Props) {
  const { id } = await params;
  const movieId = parseId(id);
  if (!movieId) notFound();

  const [movie, { locale, t }] = await Promise.all([getMovie(movieId), getI18n()]);
  if (!movie) notFound();
  // เรื่องย่อภาษาอังกฤษจาก TMDB (overview เก็บภาษาไทยเป็นหลัก)
  const overview = locale === "en" ? (movie.overview_en ?? movie.overview) : movie.overview;

  const genres = splitGenres(movie.genre);
  const rating = movie.rating === null ? null : Number(movie.rating);
  const box = movie.box_office_mil === null ? null : Number(movie.box_office_mil);
  const lead = movie.cast[0]?.actor ?? null;

  const [similar, leadOther] = await Promise.all([
    getSimilar(movie.id, genres),
    lead
      ? prisma.movies.findMany({
          where: { cast: { some: { actor_id: lead.id } }, id: { not: movie.id } },
          orderBy: [{ rating: "desc" }, { release_year: "desc" }],
          take: 16,
          select: cardSelect,
        })
      : Promise.resolve([]),
  ]);

  const providerRegion = movie.providers[0]?.region ?? null;
  const providerGroups = PROVIDER_KINDS.map((kind) => ({
    kind,
    label: t.movie.providerKinds[kind],
    items: movie.providers.filter((p) => p.kind === kind),
  })).filter((g) => g.items.length > 0);

  const facts = [
    { label: t.movie.factGross, value: box === null ? t.movie.unknown : formatGross(box) },
    { label: t.movie.factRelease, value: movie.release_date ? t.date.long(movie.release_date) : t.common.notSpecified },
    {
      label: t.movie.factLanguage,
      value: movie.original_language ? t.date.languageName(movie.original_language) : t.common.notSpecified,
    },
    {
      label: t.movie.factVoters,
      value: movie.vote_count ? t.movie.voters(movie.vote_count) : t.movie.noneYet,
    },
  ];

  const backdrop = tmdbImage(movie.backdrop_url, "w1280");
  const backdropSmall = tmdbImage(movie.backdrop_url, "w780");

  return (
    <>
      <Navbar overlay />

      <main>
        {/* ═══════ Backdrop เต็มกว้าง + โปสเตอร์ + ข้อมูล ═══════ */}
        <section className="relative isolate">
          <div className="absolute inset-x-0 top-0 -z-10 h-[62vh] min-h-[420px] overflow-hidden lg:h-[78vh]">
            {backdrop ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={backdrop}
                srcSet={`${backdropSmall} 780w, ${backdrop} 1280w`}
                sizes="100vw"
                alt=""
                fetchPriority="high"
                className="h-full w-full object-cover object-[center_25%]"
              />
            ) : (
              <div className="h-full w-full bg-surface" />
            )}
            <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink from-[6%] via-ink/70 via-50% to-ink/20" />
            <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
          </div>

          <div className="mx-auto max-w-[1400px] px-4 pt-28 sm:px-6 sm:pt-40 lg:px-10 lg:pt-[34vh]">
            <Link
              href="/movies"
              className={`inline-flex items-center gap-2 rounded-sm text-sm text-cream/75 transition-colors hover:text-gold-light ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              {t.common.allMovies}
            </Link>

            <div className="mt-6 grid gap-8 md:grid-cols-[240px_minmax(0,1fr)] md:items-end lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-12">
              {/* โปสเตอร์ */}
              <div className="mx-auto w-48 md:mx-0 md:w-full">
                <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-gold-dark/60 bg-surface shadow-[0_30px_60px_-20px_rgba(0,0,0,0.95)]">
                  <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted">
                    <Film className="h-8 w-8" />
                    <span className="font-display">{movie.title}</span>
                  </div>
                  {movie.poster_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tmdbImage(movie.poster_url, "w500") ?? undefined}
                      alt={t.movie.posterAlt(movie.title)}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  )}
                </div>
              </div>

              {/* ข้อมูล */}
              <div className="min-w-0 pb-1">
                <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-wide text-cream sm:text-5xl lg:text-6xl">
                  {movie.title}
                </h1>

                <ul className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-cream/85" aria-label={t.movie.info}>
                  {movie.release_year && <li>{movie.release_year}</li>}
                  {movie.runtime && <li>{t.movie.runtime(movie.runtime)}</li>}
                  {movie.certification && (
                    <li className="rounded-[3px] border border-cream/40 px-1.5 py-px text-xs" title={t.movie.certTitle}>
                      {movie.certification}
                    </li>
                  )}
                </ul>

                {genres.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label={t.movie.genres}>
                    {genres.map((g) => (
                      <li key={g}>
                        <Link
                          href={`/movies?genre=${encodeURIComponent(g)}`}
                          className={`inline-block rounded-[4px] border border-line bg-ink/40 px-3 py-1 text-sm text-cream/90 backdrop-blur-sm transition-colors hover:border-gold-dark hover:text-gold-light ${focusRing}`}
                        >
                          {t.common.genre(g)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
                  {rating !== null ? (
                    <>
                      <GoldStars value={rating} label={t.movie.ratingOf(rating.toFixed(1))} />
                      <span className="font-display text-3xl text-gold-light">{formatRating(movie.rating)}</span>
                      <span className="text-sm text-muted">{t.movie.tmdbScore}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted">{t.movie.noScore}</span>
                  )}
                </div>

                {overview && (
                  <p className="mt-6 max-w-3xl text-base leading-[1.85] text-cream/85">{overview}</p>
                )}

                <div className="mt-8 flex flex-wrap gap-3">
                  {movie.trailer_key && (
                    <a
                      href="#trailer"
                      className={`inline-flex h-12 items-center gap-2.5 rounded-[4px] bg-gold-gradient px-6 font-medium text-ink transition-shadow hover:glow-gold ${focusRing}`}
                    >
                      <Play className="h-4 w-4 fill-current" aria-hidden />
                      {t.movie.trailerBtn}
                    </a>
                  )}
                  <FavoriteButton
                    kind="movie"
                    variant="pill"
                    className="h-12"
                    item={{ id: movie.id, title: movie.title, poster_url: movie.poster_url, rating, year: movie.release_year }}
                  />
                </div>
              </div>
            </div>

            {/* ข้อมูลสรุป */}
            <dl className="mt-12 grid grid-cols-2 border-y border-line md:grid-cols-4">
              {facts.map((f, i) => (
                <div
                  key={f.label}
                  className={`px-1 py-5 sm:px-5 ${i % 2 === 1 ? "border-l border-line" : ""} ${i >= 2 ? "border-t border-line md:border-t-0" : ""} ${i === 2 ? "md:border-l" : ""}`}
                >
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="mt-1.5 font-serif text-lg text-cream">{f.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* ═══════ ตัวอย่างภาพยนตร์ ═══════ */}
        {movie.trailer_key && (
          <section id="trailer" aria-labelledby="trailer-title" className="mt-20 scroll-mt-24">
            <SectionHeader id="trailer-title" title={t.movie.trailerTitle} />
            <div className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6 lg:px-10">
              <div className="max-w-4xl">
                <TrailerEmbed videoKey={movie.trailer_key} title={movie.title} />
              </div>
            </div>
          </section>
        )}

        {/* ═══════ นักแสดง ═══════ */}
        <section aria-labelledby="cast-title" className="mt-20">
          <SectionHeader id="cast-title" title={t.movie.cast} description={movie.cast.length ? t.movie.castDesc(movie.cast.length) : undefined} />
          {movie.cast.length === 0 ? (
            <p className="mx-auto mt-6 max-w-[1400px] px-4 text-sm text-muted sm:px-6 lg:px-10">{t.movie.noCast}</p>
          ) : (
            <div className="mt-5">
              <RowScroller label={t.movie.cast} className="gap-6 sm:gap-8">
                {movie.cast.map(({ actor, role_name }) => (
                  <li key={actor.id} className="relative w-28 shrink-0 snap-start sm:w-36">
                    <ActorCircle actor={actor} role={role_name} />
                    <FavoriteButton
                      kind="actor"
                      variant="overlay"
                      className="right-0! top-0!"
                      item={{ id: actor.id, name: actor.name, avatar_url: actor.avatar_url, nationality: actor.nationality }}
                    />
                  </li>
                ))}
              </RowScroller>
            </div>
          )}
        </section>

        {/* ═══════ ดูได้ที่ไหน ═══════ */}
        <section aria-labelledby="watch-title" className="mt-20">
          <SectionHeader
            id="watch-title"
            title={t.movie.whereToWatch}
            description={providerRegion === "TH" ? t.movie.providersTH : providerRegion ? t.movie.providersUS : undefined}
          />
          <div className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6 lg:px-10">
            {providerGroups.length === 0 ? (
              <p className="text-sm text-muted">{t.movie.noProviders}</p>
            ) : (
              <div className="grid gap-8 md:grid-cols-3">
                {providerGroups.map((group) => (
                  <div key={group.kind}>
                    <h3 className="text-sm font-medium text-cream">{group.label}</h3>
                    <ul className="mt-3 flex flex-wrap gap-3">
                      {group.items.map((p) => (
                        <li key={p.provider_id} title={p.provider_name}>
                          {p.logo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.logo_url}
                              alt={p.provider_name}
                              loading="lazy"
                              className="h-12 w-12 rounded-[6px] border border-line object-cover"
                            />
                          ) : (
                            <span className="flex h-12 items-center rounded-[6px] border border-line px-3 text-xs text-cream">
                              {p.provider_name}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {movie.tmdb_id && providerGroups.length > 0 && (
              <p className="mt-6 text-xs text-muted">
                {t.movie.justwatch}{" "}
                <a
                  href={`https://www.themoviedb.org/movie/${movie.tmdb_id}/watch?locale=${providerRegion ?? "TH"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rounded-sm text-gold-light underline decoration-gold-dark underline-offset-4 hover:decoration-gold ${focusRing}`}
                >
                  {t.movie.allLinks}
                </a>
              </p>
            )}
          </div>
        </section>

        {/* ═══════ ผลงานอื่นของนักแสดงนำ + หนังที่คล้ายกัน ═══════ */}
        {lead && (
          <MovieRow
            id="lead-other"
            title={t.movie.leadOther(lead.name)}
            href={`/actors/${lead.id}#filmography`}
            linkLabel={t.movie.leadOtherLink}
            movies={leadOther}
          />
        )}
        <MovieRow
          id="similar"
          title={t.movie.similar}
          description={genres.length ? t.movie.similarDesc(genres.map(t.common.genre).join(", ")) : undefined}
          movies={similar}
        />

        {/* ═══════ รีวิวจากผู้ใช้ ═══════ */}
        <section aria-labelledby="reviews-title" className="mt-20">
          <SectionHeader
            id="reviews-title"
            title={t.movie.reviews}
            description={movie.reviews.length ? t.movie.reviewsDesc : undefined}
          />
          <div className="mx-auto mt-6 max-w-[1400px] px-4 sm:px-6 lg:px-10">
            {movie.reviews.length === 0 ? (
              <p className="text-sm text-muted">{t.movie.noReviews}</p>
            ) : (
              <ul className="grid max-w-4xl gap-5">
                {movie.reviews.map((r) => {
                  const paragraphs = cleanReviewParagraphs(r.content);
                  const reviewRating = r.rating === null ? null : Number(r.rating);
                  return (
                    <li key={r.id} className="rounded-card border border-line bg-surface p-6 sm:p-8">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="font-medium text-cream">
                          {r.author}
                          {r.written_at && (
                            <span className="ml-3 text-sm font-normal text-muted">{t.date.long(r.written_at)}</span>
                          )}
                        </p>
                        {reviewRating !== null && (
                          <span className="inline-flex items-center gap-2 text-sm text-gold-light">
                            <GoldStars value={reviewRating} label={t.movie.ratingOf(String(reviewRating))} size="h-3.5 w-3.5" />
                            {reviewRating}/10
                          </span>
                        )}
                      </div>

                      {/* ย่อหน้าแรกแสดงเลย ที่เหลือกดอ่านต่อ (details/summary ไม่ต้องใช้ JS) */}
                      <div lang="en" className="mt-4 font-serif text-[16px] leading-8 text-cream/90">
                        <p>{paragraphs[0]}</p>
                        {paragraphs.length > 1 && (
                          <details className="group mt-3">
                            <summary
                              className={`inline-block cursor-pointer list-none rounded-sm font-sans text-sm text-gold-light underline decoration-gold-dark underline-offset-4 hover:decoration-gold ${focusRing}`}
                            >
                              <span className="group-open:hidden">{t.common.readMore}</span>
                              <span className="hidden group-open:inline">{t.common.showLess}</span>
                            </summary>
                            <div className="mt-3 space-y-3">
                              {paragraphs.slice(1).map((p, i) => (
                                <p key={i}>{p}</p>
                              ))}
                            </div>
                          </details>
                        )}
                      </div>

                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`mt-5 inline-block rounded-sm text-xs text-muted underline decoration-line underline-offset-4 hover:text-gold-light ${focusRing}`}
                      >
                        {t.movie.reviewOriginal}
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
