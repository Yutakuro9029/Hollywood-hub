import Link from "next/link";
import {
  ArrowRight,
  Award,
  Clapperboard,
  Film,
  Globe2,
  Search,
  Users,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getGenreCounts, getNationalities } from "@/lib/catalog";
import { formatNumber } from "@/lib/format";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import { ActorCard } from "@/components/actor-card";
import { MovieCard } from "@/components/movie-card";

// ดึงข้อมูลสดจาก MySQL ทุกครั้ง (ไม่ให้ build พยายามต่อ DB ตอน build time)
export const dynamic = "force-dynamic";

function SectionHeader({
  title,
  subtitle,
  href,
  cta,
}: {
  title: string;
  subtitle: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-100">
          {title}
        </h2>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>
      </div>
      <Link
        href={href}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-700 transition hover:gap-2.5 dark:text-amber-300"
      >
        {cta}
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [spotlightActors, topMovieRows, actorCount, movieCount, awardSum, nationalities, genreCounts] =
    await Promise.all([
      prisma.actors.findMany({
        orderBy: [{ awards_count: "desc" }, { name: "asc" }],
        take: 4,
        include: {
          movies: { orderBy: { rating: "desc" }, take: 2 },
          _count: { select: { movies: true } },
        },
      }),
      // ดึงเผื่อไว้ แล้วรวมเรื่องที่ชื่อ/ปีซ้ำกัน (หนังเรื่องเดียวกันที่ดารามากกว่า 1 คนนำแสดง)
      prisma.movies.findMany({
        where: { rating: { not: null } },
        orderBy: [{ rating: "desc" }, { box_office_mil: "desc" }],
        take: 18,
        include: { actors: { select: { name: true } } },
      }),
      prisma.actors.count(),
      prisma.movies.count(),
      prisma.actors.aggregate({ _sum: { awards_count: true } }),
      getNationalities(),
      getGenreCounts(),
    ]);

  const grouped = new Map<string, { movie: (typeof topMovieRows)[number]; actors: string[] }>();
  for (const movie of topMovieRows) {
    const key = `${movie.title}|${movie.release_year ?? ""}`;
    const entry = grouped.get(key);
    if (entry) entry.actors.push(movie.actors.name);
    else grouped.set(key, { movie, actors: [movie.actors.name] });
  }
  const topMovies = Array.from(grouped.values()).slice(0, 6);

  const quickGenres = genreCounts.slice(0, 8);

  const stats = [
    { icon: Users, label: "ดาราในระบบ", value: formatNumber(actorCount) },
    { icon: Film, label: "ภาพยนตร์", value: formatNumber(movieCount) },
    { icon: Award, label: "รางวัลรวม", value: formatNumber(awardSum._sum.awards_count ?? 0) },
    { icon: Globe2, label: "สัญชาติ", value: formatNumber(nationalities.length) },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-slate-950 dark:text-zinc-100">
      <Navbar />

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.2),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.14),transparent_60%)]"
        />
        <Clapperboard
          aria-hidden
          className="pointer-events-none absolute -right-16 top-1/2 hidden h-[28rem] w-[28rem] -translate-y-1/2 -rotate-12 text-amber-400/10 lg:block"
        />
        {/* แถบฟิล์มตกแต่งด้านบนและล่าง */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,#fbbf24_0_14px,transparent_14px_28px)] opacity-70"
        />
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(90deg,#fbbf24_0_14px,transparent_14px_28px)] opacity-70"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8 lg:py-28">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-7xl dark:text-zinc-100">
              ใต้แสงสปอตไลต์
              <span className="block text-amber-600 dark:text-amber-400">ของฮอลลีวูด</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              Hollywood Cast &amp; Filmography Hub รวมข้อมูลดาราระดับโลกและภาพยนตร์ที่ทำให้พวกเขาเป็นตำนาน
              ค้นหาง่าย ดูผลงานครบ ในที่เดียว
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/actors"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                <Users className="h-4 w-4" aria-hidden />
                สำรวจรายชื่อดารา
              </Link>
              <Link
                href="/movies"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition hover:border-amber-500 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-amber-400 dark:hover:text-amber-300"
              >
                <Film className="h-4 w-4" aria-hidden />
                ดูภาพยนตร์เด่น
              </Link>
            </div>

            {/* Quick Search: ปุ่ม 2 ปุ่มใช้ formAction เลือกปลายทาง จึงทำงานได้โดยไม่ต้องใช้ Client JS */}
            <div className="mt-10 max-w-2xl rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/70 dark:shadow-none">
              <form action="/actors" method="get" role="search" className="flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <label htmlFor="quick-q" className="sr-only">
                    ค้นหาดาราหรือภาพยนตร์
                  </label>
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                    aria-hidden
                  />
                  <input
                    id="quick-q"
                    name="q"
                    type="search"
                    placeholder="ค้นหาชื่อดารา หรือชื่อภาพยนตร์…"
                    className="w-full rounded-lg border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-amber-400"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    formAction="/actors"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
                  >
                    <Users className="h-4 w-4" aria-hidden />
                    หาดารา
                  </button>
                  <button
                    type="submit"
                    formAction="/movies"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-amber-500/70 px-4 py-2.5 text-sm font-semibold text-amber-700 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/60 dark:text-amber-300"
                  >
                    <Film className="h-4 w-4" aria-hidden />
                    หาหนัง
                  </button>
                </div>
              </form>

              {quickGenres.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-zinc-500">แนวยอดนิยม:</span>
                  {quickGenres.map(({ genre }) => (
                    <Link
                      key={genre}
                      href={`/movies?genre=${encodeURIComponent(genre)}`}
                      className="rounded-full border border-zinc-300 px-3 py-1 text-xs text-zinc-700 transition hover:border-amber-500 hover:text-amber-700 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:text-amber-300"
                    >
                      {genre}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ───────── Stats Banner ───────── */}
      <section aria-label="สถิติ" className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
        <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-6 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:px-8">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" aria-hidden />
              <dd className="mt-2 text-3xl font-extrabold text-zinc-900 dark:text-zinc-100">{value}</dd>
              <dt className="text-sm text-zinc-600 dark:text-zinc-400">{label}</dt>
            </div>
          ))}
        </dl>
      </section>

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-14 sm:px-6 lg:px-8">
        {/* ───────── Spotlight Actors ───────── */}
        <section>
          <SectionHeader
            title="ดาราในสปอตไลต์"
            subtitle="ดาราที่ได้รับรางวัลมากที่สุด"
            href="/actors"
            cta="ดูดาราทั้งหมด"
          />
          {spotlightActors.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              ยังไม่มีข้อมูลดารา
            </p>
          ) : (
            <ul className="grid gap-6 md:grid-cols-2">
              {spotlightActors.map((actor) => (
                <li key={actor.id}>
                  <ActorCard actor={actor} />
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ───────── Top Rated Movies ───────── */}
        <section>
          <SectionHeader
            title="ภาพยนตร์เรตติ้งสูงสุด"
            subtitle="6 เรื่องที่ได้คะแนนสูงสุดในระบบ"
            href="/movies"
            cta="ดูภาพยนตร์ทั้งหมด"
          />
          {topMovies.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700">
              ยังไม่มีข้อมูลภาพยนตร์
            </p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
              {topMovies.map(({ movie, actors }) => (
                <li key={movie.id}>
                  <MovieCard movie={movie} actorNames={actors} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
