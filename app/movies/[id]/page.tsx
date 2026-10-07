import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  CalendarDays,
  Clapperboard,
  Globe,
  Star,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatNumber, formatRating, getInitials } from "@/lib/format";
import Navbar from "@/components/navbar";
import FavoriteButton from "@/components/favorite-button";

/* ───────────────────────── Types & data ───────────────────────── */

type Props = { params: Promise<{ id: string }> };

/** ใช้ cache() เพื่อให้ generateMetadata และ page แชร์ผลการ query เดียวกันในหนึ่ง request */
const getMovie = cache((id: number) =>
  prisma.movies.findUnique({
    where: { id },
    include: { actors: true },
  }),
);

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 && n <= 4_294_967_295 ? n : null;
}

function splitGenres(genre: string | null): string[] {
  return (genre ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
}

/** รายได้หน่วยล้านดอลลาร์ เช่น 836.8 → "$836.8M" */
function boxOfficeM(mil: number): string {
  return mil > 0 ? `$${formatNumber(mil)}M` : "-";
}

/** รายได้หน่วยพันล้านดอลลาร์ (แสดงเมื่อ ≥ 1,000 ล้าน) */
function boxOfficeB(mil: number): string | null {
  return mil >= 1000 ? `ประมาณ $${(mil / 1000).toFixed(2)} พันล้าน` : null;
}

/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseId(id);
  const movie = movieId ? await getMovie(movieId) : null;

  if (!movie) return { title: "ไม่พบภาพยนตร์ | Hollywood Hub" };

  const year = movie.release_year ? ` (${movie.release_year})` : "";
  const title = `${movie.title}${year} | Hollywood Hub`;
  const genres = splitGenres(movie.genre).join(", ");
  const description = [
    `${movie.title} นำแสดงโดย ${movie.actors.name}`,
    movie.role_name ? `รับบท ${movie.role_name}` : null,
    genres ? `แนว ${genres}` : null,
  ]
    .filter(Boolean)
    .join(" ");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: movie.poster_url ? [movie.poster_url] : undefined,
    },
  };
}

/* ───────────────────────── UI pieces ───────────────────────── */

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950";

/** ดาว 5 ดวง เติมสีตามสัดส่วนคะแนน (เต็ม 10) รองรับเศษดาว */
function StarRating({ value }: { value: number }) {
  const percent = Math.max(0, Math.min(100, (value / 10) * 100));
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className="h-5 w-5 shrink-0 fill-current" aria-hidden />
  ));

  return (
    <div
      role="img"
      aria-label={`คะแนน ${value.toFixed(1)} จาก 10`}
      className="relative inline-flex"
    >
      <div className="flex gap-0.5 text-zinc-300 dark:text-zinc-700">{stars}</div>
      <div
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-amber-500 dark:text-amber-400"
        style={{ width: `${percent}%` }}
      >
        {stars}
      </div>
    </div>
  );
}

function PosterFallback({ title }: { title: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 p-6 text-center text-zinc-500 dark:text-zinc-400">
      <Clapperboard className="h-10 w-10" aria-hidden />
      <span className="font-display text-lg">{title}</span>
    </div>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default async function MoviePage({ params }: Props) {
  const { id } = await params;

  const movieId = parseId(id);
  if (!movieId) notFound();

  const movie = await getMovie(movieId);
  if (!movie) notFound();

  const actor = movie.actors;
  const genres = splitGenres(movie.genre);
  const rating = movie.rating === null ? null : Number(movie.rating);
  const box = Number(movie.box_office_mil);

  // ภาพยนตร์เรื่องอื่นของดาราคนเดียวกัน
  const otherMovies = await prisma.movies.findMany({
    where: { actor_id: movie.actor_id, id: { not: movie.id } },
    orderBy: [{ rating: "desc" }, { release_year: "desc" }],
    take: 4,
  });

  return (
    <>
      <Navbar />

      <main>
        {/* ───── Showcase ───── */}
        <section className="relative isolate overflow-hidden">
          {/* Backdrop: โปสเตอร์เบลอเป็นฉากหลัง */}
          {movie.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster_url}
              alt=""
              aria-hidden
              className="absolute inset-0 -z-20 h-full w-full scale-125 object-cover opacity-25 blur-3xl dark:opacity-30"
            />
          )}
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-linear-to-b from-zinc-50/30 via-zinc-50/80 to-zinc-50 dark:from-slate-950/40 dark:via-slate-950/80 dark:to-slate-950"
          />

          <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
            <Link
              href="/movies"
              className={`inline-flex items-center gap-2 rounded-lg py-1.5 text-sm text-zinc-600 transition-colors hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300 ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              ภาพยนตร์ทั้งหมด
            </Link>

            <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)] lg:gap-14">
              {/* โปสเตอร์ */}
              <div className="mx-auto w-64 sm:w-72 lg:w-full">
                <div className="aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 shadow-2xl shadow-black/40 ring-1 ring-zinc-900/10 dark:bg-slate-900 dark:ring-white/10">
                  {movie.poster_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={movie.poster_url}
                      alt={`โปสเตอร์ภาพยนตร์ ${movie.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <PosterFallback title={movie.title} />
                  )}
                </div>
              </div>

              {/* รายละเอียด */}
              <div className="min-w-0">
                <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
                  {movie.title}
                </h1>

                <p className="mt-4 inline-flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
                  <CalendarDays className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                  {movie.release_year ? `ฉายปี ${movie.release_year}` : "ไม่ระบุปีที่ฉาย"}
                </p>

                {genres.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2" aria-label="แนวภาพยนตร์">
                    {genres.map((g) => (
                      <li
                        key={g}
                        className="rounded-full border border-amber-500/50 bg-amber-400/10 px-3 py-1 text-sm font-medium text-amber-800 dark:border-amber-400/40 dark:text-amber-300"
                      >
                        {g}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-6">
                  <FavoriteButton
                    kind="movie"
                    variant="pill"
                    item={{
                      id: movie.id,
                      title: movie.title,
                      poster_url: movie.poster_url,
                      rating,
                      year: movie.release_year,
                    }}
                  />
                </div>

                {/* Rating + Box Office */}
                <div className="mt-8 grid max-w-xl grid-cols-1 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 sm:grid-cols-2 dark:border-zinc-800 dark:bg-zinc-800">
                  <div className="bg-white p-5 dark:bg-slate-900">
                    <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                      คะแนนเรตติ้ง
                    </p>
                    <p className="mt-2 flex items-baseline gap-2">
                      <span className="font-display text-5xl font-bold text-amber-600 dark:text-amber-300">
                        {formatRating(movie.rating)}
                      </span>
                      <span className="text-zinc-500 dark:text-zinc-400">/ 10</span>
                    </p>
                    <div className="mt-3">
                      {rating === null ? (
                        <span className="text-sm text-zinc-500 dark:text-zinc-400">ยังไม่มีคะแนน</span>
                      ) : (
                        <StarRating value={rating} />
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-5 dark:bg-slate-900">
                    <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                      <Banknote className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                      Box Office ทั่วโลก
                    </p>
                    <p className="mt-2 font-display text-4xl font-bold text-zinc-900 dark:text-zinc-50">
                      {boxOfficeM(box)}
                    </p>
                    <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                      {boxOfficeB(box) ?? "หน่วยล้านดอลลาร์สหรัฐ"}
                    </p>
                  </div>
                </div>

                {/* ดารานำ */}
                <div className="mt-10">
                  <h2 className="font-display text-xl font-bold text-zinc-900 dark:text-zinc-50">ดารานำ</h2>

                  <div className="mt-4 flex max-w-xl flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row sm:items-center dark:border-zinc-800 dark:bg-slate-900">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-slate-950 ring-2 ring-amber-400/70">
                      {actor.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={actor.avatar_url}
                          alt={`ภาพโปรไฟล์ของ ${actor.name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-amber-400">
                          {getInitials(actor.name)}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-display text-xl font-semibold text-zinc-900 dark:text-zinc-50">
                        {actor.name}
                      </p>
                      {movie.role_name && (
                        <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-300">
                          รับบทเป็น {movie.role_name}
                        </p>
                      )}
                      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {actor.nationality && (
                          <span className="inline-flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" aria-hidden />
                            {actor.nationality}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5">
                          <Trophy className="h-3.5 w-3.5" aria-hidden />
                          {formatNumber(actor.awards_count)} รางวัล
                        </span>
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <FavoriteButton
                        kind="actor"
                        variant="icon"
                        className="h-10 w-10"
                        item={{
                          id: actor.id,
                          name: actor.name,
                          avatar_url: actor.avatar_url,
                          nationality: actor.nationality,
                        }}
                      />
                      <Link
                        href={`/actors/${actor.id}`}
                        className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 ${focusRing}`}
                      >
                        ดูประวัติดารา
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── ภาพยนตร์เรื่องอื่นของดารา ───── */}
        {otherMovies.length > 0 && (
          <section
            aria-labelledby="more-title"
            className="border-t border-zinc-200 dark:border-zinc-800"
          >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2
                  id="more-title"
                  className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
                >
                  ผลงานเรื่องอื่นของ {actor.name}
                </h2>
                <Link
                  href={`/actors/${actor.id}#filmography`}
                  className={`inline-flex items-center gap-2 rounded-lg text-sm font-medium text-amber-700 transition-colors hover:text-amber-600 dark:text-amber-300 dark:hover:text-amber-200 ${focusRing}`}
                >
                  ดูผลงานทั้งหมด
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </div>

              <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
                {otherMovies.map((m) => (
                  <li key={m.id} className="relative">
                    <Link href={`/movies/${m.id}`} className={`group block rounded-lg ${focusRing}`}>
                      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-900/10 dark:bg-slate-900 dark:ring-white/10">
                        {m.poster_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.poster_url}
                            alt={`โปสเตอร์ภาพยนตร์ ${m.title}`}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
                          />
                        ) : (
                          <PosterFallback title={m.title} />
                        )}
                        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-950/85 px-2 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
                          <Star className="h-3 w-3 fill-current" aria-hidden />
                          {formatRating(m.rating)}
                        </span>
                      </div>
                      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-amber-700 dark:text-zinc-50 dark:group-hover:text-amber-300">
                        {m.title}
                      </h3>
                      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
                        {m.release_year ?? "ไม่ระบุปีที่ฉาย"}
                      </p>
                    </Link>

                    {/* sibling ของ <Link> (ห้ามซ้อน button ใน a) ทับมุมขวาบนของโปสเตอร์ */}
                    <FavoriteButton
                      kind="movie"
                      variant="overlay"
                      item={{
                        id: m.id,
                        title: m.title,
                        poster_url: m.poster_url,
                        rating: m.rating === null ? null : Number(m.rating),
                        year: m.release_year,
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
