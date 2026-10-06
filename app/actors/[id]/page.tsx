import type { Metadata } from "next";
import Link from "next/link";
import { cache, type ReactNode } from "react";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Banknote,
  Cake,
  Clapperboard,
  Film,
  Globe,
  Star,
  Trophy,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { calcAge, formatNumber, formatRating, getInitials } from "@/lib/format";
import Navbar from "@/components/navbar";

/* ───────────────────────── Types & data ───────────────────────── */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

const SORTS = [
  { key: "year", label: "ล่าสุด" },
  { key: "rating", label: "คะแนนสูงสุด" },
  { key: "boxoffice", label: "รายได้สูงสุด" },
] as const;
type SortKey = (typeof SORTS)[number]["key"];

/** ใช้ cache() เพื่อให้ generateMetadata และ page แชร์ผลการ query เดียวกันในหนึ่ง request */
const getActor = cache((id: number) =>
  prisma.actors.findUnique({
    where: { id },
    include: { movies: { orderBy: [{ release_year: "desc" }, { id: "desc" }] } },
  }),
);
type ActorWithMovies = NonNullable<Awaited<ReturnType<typeof getActor>>>;
type Movie = ActorWithMovies["movies"][number];

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 && n <= 4_294_967_295 ? n : null;
}

function sortMovies(movies: Movie[], sort: SortKey): Movie[] {
  const byYear = (a: Movie, b: Movie) => (b.release_year ?? 0) - (a.release_year ?? 0);
  return [...movies].sort((a, b) => {
    if (sort === "rating") {
      return Number(b.rating ?? -1) - Number(a.rating ?? -1) || byYear(a, b);
    }
    if (sort === "boxoffice") {
      return Number(b.box_office_mil) - Number(a.box_office_mil) || byYear(a, b);
    }
    return byYear(a, b);
  });
}

/** รายได้หน่วยล้านดอลลาร์ เช่น 836.8 → "$836.8M" */
function boxOfficeM(mil: number): string {
  return mil > 0 ? `$${formatNumber(mil)}M` : "-";
}

/** รายได้หน่วยพันล้านดอลลาร์ (แสดงเมื่อ ≥ 1,000 ล้าน) */
function boxOfficeB(mil: number): string | null {
  return mil >= 1000 ? `ประมาณ $${(mil / 1000).toFixed(2)} พันล้าน` : null;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const actorId = parseId(id);
  const actor = actorId ? await getActor(actorId) : null;

  if (!actor) return { title: "ไม่พบดารา | Hollywood Hub" };

  const title = `${actor.name} | Hollywood Hub`;
  const description = actor.bio
    ? truncate(actor.bio, 160)
    : `ประวัติและผลงานภาพยนตร์ทั้งหมดของ ${actor.name}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: actor.avatar_url ? [actor.avatar_url] : undefined,
    },
  };
}

/* ───────────────────────── UI pieces ───────────────────────── */

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950";

function Poster({ url, title, className }: { url: string | null; title: string; className?: string }) {
  if (!url) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center text-zinc-500 dark:text-zinc-400">
        <Clapperboard className="h-8 w-8" aria-hidden />
        <span className="text-sm">{title}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={`โปสเตอร์ภาพยนตร์ ${title}`} loading="lazy" className={className} />
  );
}

function Stat({
  icon,
  label,
  children,
  hint,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
  hint?: string | null;
}) {
  return (
    <div className="bg-white p-5 dark:bg-slate-900">
      <p className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
        <span className="text-amber-600 dark:text-amber-400" aria-hidden>
          {icon}
        </span>
        {label}
      </p>
      <div className="mt-2 font-display text-3xl font-bold leading-tight text-zinc-900 dark:text-zinc-50">
        {children}
      </div>
      {hint && <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function MovieCard({ movie }: { movie: Movie }) {
  const box = Number(movie.box_office_mil);
  return (
    <li>
      <Link href={`/movies/${movie.id}`} className={`group block rounded-lg ${focusRing}`}>
        <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-zinc-200 ring-1 ring-zinc-900/10 dark:bg-slate-900 dark:ring-white/10">
          <Poster
            url={movie.poster_url}
            title={movie.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
          <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-950/85 px-2 py-1 text-xs font-semibold text-amber-300 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-current" aria-hidden />
            {formatRating(movie.rating)}
          </span>
        </div>

        <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-zinc-900 transition-colors group-hover:text-amber-700 dark:text-zinc-50 dark:group-hover:text-amber-300">
          {movie.title}
        </h3>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          {movie.release_year ?? "ไม่ระบุปีที่ฉาย"}
        </p>
        {movie.role_name && (
          <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-300">รับบท {movie.role_name}</p>
        )}
        <p className="mt-1 text-sm font-medium text-amber-700 dark:text-amber-300">
          {boxOfficeM(box)}
        </p>
      </Link>
    </li>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default async function ActorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { sort: sortParam } = await searchParams;

  const actorId = parseId(id);
  if (!actorId) notFound();

  const actor = await getActor(actorId);
  if (!actor) notFound();

  const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  const sort: SortKey = SORTS.some((s) => s.key === sortValue) ? (sortValue as SortKey) : "year";
  const movies = sortMovies(actor.movies, sort);

  // สถิติรวมของผลงานทั้งหมด
  const totalBox = actor.movies.reduce((sum, m) => sum + Number(m.box_office_mil), 0);
  const rated = actor.movies.filter((m) => m.rating !== null);
  const avgRating = rated.length
    ? rated.reduce((sum, m) => sum + Number(m.rating), 0) / rated.length
    : null;
  const topGrossing = actor.movies.reduce<Movie | null>(
    (best, m) => (!best || Number(m.box_office_mil) > Number(best.box_office_mil) ? m : best),
    null,
  );

  const age = calcAge(actor.birth_date);
  const birthText = actor.birth_date
    ? new Intl.DateTimeFormat("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(actor.birth_date)
    : null;

  return (
    <>
      <Navbar />

      <main>
        {/* ───── Hero ───── */}
        <section className="relative isolate overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(60%_55%_at_15%_0%,rgba(251,191,36,0.16),transparent_70%)] dark:bg-[radial-gradient(60%_55%_at_15%_0%,rgba(251,191,36,0.12),transparent_70%)]"
          />

          <div className="mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8 lg:pb-20">
            <Link
              href="/actors"
              className={`inline-flex items-center gap-2 rounded-lg py-1.5 text-sm text-zinc-600 transition-colors hover:text-amber-700 dark:text-zinc-400 dark:hover:text-amber-300 ${focusRing}`}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              รายชื่อดารา
            </Link>

            <div className="mt-6 grid gap-10 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-14">
              {/* ภาพโปรไฟล์ในกรอบป้ายไฟโรงหนัง */}
              <div className="mx-auto w-full max-w-xs lg:max-w-none">
                <div className="relative rounded-md bg-zinc-900 p-[22px] shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/30">
                  <div className="bulb-strip bulb-h inset-x-0 top-0 h-[22px]" />
                  <div className="bulb-strip bulb-h inset-x-0 bottom-0 h-[22px]" />
                  <div className="bulb-strip bulb-v bottom-[22px] left-0 top-[22px] w-[22px]" />
                  <div className="bulb-strip bulb-v bottom-[22px] right-0 top-[22px] w-[22px]" />

                  <div className="relative aspect-square overflow-hidden bg-slate-950">
                    {actor.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={actor.avatar_url}
                        alt={`ภาพโปรไฟล์ของ ${actor.name}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-display text-7xl font-bold text-amber-400">
                        {getInitials(actor.name)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ข้อมูลดารา */}
              <div className="min-w-0">
                <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-50">
                  {actor.name}
                </h1>

                <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-700 dark:text-zinc-300">
                  <li className="inline-flex items-center gap-2">
                    <Globe className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                    {actor.nationality ?? "ไม่ระบุสัญชาติ"}
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Cake className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                    {birthText ? (
                      <>
                        {birthText}
                        {age !== null && <span className="text-zinc-500 dark:text-zinc-400">(อายุ {age} ปี)</span>}
                      </>
                    ) : (
                      "ไม่ระบุวันเกิด"
                    )}
                  </li>
                  <li className="inline-flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
                    {formatNumber(actor.awards_count)} รางวัล
                  </li>
                </ul>

                {actor.bio ? (
                  <p className="mt-6 max-w-prose whitespace-pre-line text-base leading-8 text-zinc-700 dark:text-zinc-300">
                    {actor.bio}
                  </p>
                ) : (
                  <p className="mt-6 text-zinc-500 dark:text-zinc-400">ยังไม่มีประวัติของดาราคนนี้</p>
                )}

                {/* Quick stats */}
                <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 lg:grid-cols-4 dark:border-zinc-800 dark:bg-zinc-800">
                  <Stat icon={<Film className="h-4 w-4" />} label="ผลงานในระบบ">
                    {actor.movies.length}
                    <span className="ml-1 text-base font-medium text-zinc-500 dark:text-zinc-400">เรื่อง</span>
                  </Stat>
                  <Stat
                    icon={<Banknote className="h-4 w-4" />}
                    label="Box Office รวม"
                    hint={boxOfficeB(totalBox)}
                  >
                    {boxOfficeM(totalBox)}
                  </Stat>
                  <Stat icon={<Star className="h-4 w-4" />} label="คะแนนเฉลี่ย" hint={rated.length ? `จาก ${rated.length} เรื่อง` : null}>
                    {avgRating === null ? "-" : avgRating.toFixed(1)}
                  </Stat>
                  <Stat
                    icon={<Clapperboard className="h-4 w-4" />}
                    label="ทำเงินสูงสุด"
                    hint={topGrossing ? boxOfficeM(Number(topGrossing.box_office_mil)) : null}
                  >
                    {topGrossing ? (
                      <Link
                        href={`/movies/${topGrossing.id}`}
                        className={`line-clamp-2 rounded text-xl transition-colors hover:text-amber-700 dark:hover:text-amber-300 ${focusRing}`}
                      >
                        {topGrossing.title}
                      </Link>
                    ) : (
                      "-"
                    )}
                  </Stat>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───── Filmography ───── */}
        <section
          id="filmography"
          aria-labelledby="filmography-title"
          className="border-t border-zinc-200 dark:border-zinc-800"
        >
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2
                id="filmography-title"
                className="font-display text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50"
              >
                ผลงานภาพยนตร์ ({actor.movies.length} เรื่อง)
              </h2>

              {actor.movies.length > 1 && (
                <nav aria-label="เรียงลำดับผลงาน" className="flex items-center gap-1 rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
                  {SORTS.map(({ key, label }) => {
                    const active = key === sort;
                    return (
                      <Link
                        key={key}
                        href={key === "year" ? `/actors/${actor.id}` : `/actors/${actor.id}?sort=${key}`}
                        scroll={false}
                        aria-current={active ? "true" : undefined}
                        className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${focusRing} ${
                          active
                            ? "bg-amber-400 text-slate-950"
                            : "text-zinc-600 hover:bg-zinc-200/70 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        }`}
                      >
                        {label}
                      </Link>
                    );
                  })}
                </nav>
              )}
            </div>

            {movies.length === 0 ? (
              <p className="mt-10 rounded-xl border border-dashed border-zinc-300 px-6 py-12 text-center text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                ยังไม่มีผลงานภาพยนตร์ของ {actor.name} ในระบบ
              </p>
            ) : (
              <ul className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {movies.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} />
                ))}
              </ul>
            )}
          </div>
        </section>
      </main>
    </>
  );
}
