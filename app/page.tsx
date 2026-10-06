import Link from "next/link";
import { Award, Film, Globe2, LayoutDashboard, LogIn, Search, Star, Users } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getGenreCounts, getNationalities } from "@/lib/catalog";
import { calcAge, formatRating, getInitials } from "@/lib/format";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";

// ดึงข้อมูลสดจาก MySQL ทุกครั้ง (ไม่ให้ build พยายามต่อ DB ตอน build time)
export const dynamic = "force-dynamic";

/* ───────────────────────── Helpers ───────────────────────── */

/** รายได้เป็นล้านดอลลาร์ → "$2.26B" / "$837M" */
function formatGross(mil: { toString(): string }): string {
  const n = Number(mil.toString());
  if (!Number.isFinite(n)) return "-";
  return n >= 1000 ? `$${(n / 1000).toFixed(2)}B` : `$${Math.round(n)}M`;
}

const searchHref = (path: "/actors" | "/movies", q: string) =>
  `${path}?q=${encodeURIComponent(q)}`;

/** รูปดารา: ตัวอักษรย่อวางใต้รูป ถ้ารูปโหลดไม่ได้ (alt ว่าง) จะเห็นตัวอักษรย่อแทน */
function Avatar({ name, url, className = "" }: { name: string; url: string | null; className?: string }) {
  return (
    <div
      className={`relative overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-slate-900 ${className}`}
    >
      <span
        aria-hidden
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-amber-600 dark:text-amber-400"
      >
        {getInitials(name)}
      </span>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

/** โปสเตอร์หนัง: ถ้ารูปโหลดไม่ได้จะเห็นไอคอนกับชื่อเรื่องแทน */
function Poster({ title, url, className = "" }: { title: string; url: string | null; className?: string }) {
  return (
    <div
      className={`relative aspect-[2/3] overflow-hidden bg-gradient-to-br from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-slate-900 ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-zinc-500 dark:text-zinc-400"
      >
        <Film className="h-6 w-6" />
        <span className="line-clamp-3 text-xs font-medium">{title}</span>
      </div>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function SectionHeading({
  title,
  description,
  href,
  cta,
}: {
  title: string;
  description: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="max-w-xl">
        <h2 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          {title}
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">{description}</p>
      </div>
      <Link
        href={href}
        className="rounded-md text-sm font-semibold text-amber-700 underline decoration-amber-500/40 underline-offset-4 transition-colors hover:decoration-amber-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none dark:text-amber-300"
      >
        {cta}
      </Link>
    </div>
  );
}

const chipClass =
  "inline-flex items-center gap-1.5 rounded-full border border-zinc-300 px-3.5 py-1.5 text-sm text-zinc-700 transition-colors hover:border-amber-400 hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-amber-400 dark:hover:text-slate-950";

/* ───────────────────────── Page ───────────────────────── */

export default async function HomePage() {
  const [session, spotlightActors, boxOfficeRows, genreCounts, nationalities, actorCount, movieCount] =
    await Promise.all([
      getSession(),
      prisma.actors.findMany({
        orderBy: [{ awards_count: "desc" }, { name: "asc" }],
        take: 4,
        include: {
          movies: { orderBy: { rating: "desc" }, take: 2 },
          _count: { select: { movies: true } },
        },
      }),
      // ดึงเผื่อไว้ แล้วตัดเรื่องที่ชื่อ/ปีซ้ำกันออก (หนังเรื่องเดียวกันที่ดารามากกว่า 1 คนนำแสดง)
      prisma.movies.findMany({
        orderBy: [{ box_office_mil: "desc" }, { title: "asc" }],
        take: 16,
      }),
      getGenreCounts(),
      getNationalities(),
      prisma.actors.count(),
      prisma.movies.count(),
    ]);

  const uniqueMovies = new Map<string, (typeof boxOfficeRows)[number]>();
  for (const movie of boxOfficeRows) {
    const key = `${movie.title}|${movie.release_year ?? ""}`;
    if (!uniqueMovies.has(key)) uniqueMovies.set(key, movie);
  }
  const blockbusters = Array.from(uniqueMovies.values()).slice(0, 8);
  const lead = blockbusters[0];

  const [topActor, ...otherActors] = spotlightActors;

  return (
    <>
      <Navbar />

      <main>
        {/* ═════════ Hero: ป้ายไฟโรงหนัง ═════════ */}
        <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
          <div className="relative rounded-[2rem] bg-slate-900 p-[22px] shadow-xl shadow-zinc-900/25 ring-1 ring-amber-400/30 dark:shadow-black/50">
            {/* หลอดไฟรอบป้าย */}
            <div aria-hidden>
              <div className="bulb-strip bulb-h inset-x-0 top-0 h-[22px]" />
              <div className="bulb-strip bulb-h inset-x-0 bottom-0 h-[22px]" />
              <div className="bulb-strip bulb-v bottom-[22px] left-0 top-[22px] w-[22px]" />
              <div className="bulb-strip bulb-v bottom-[22px] right-0 top-[22px] w-[22px]" />
            </div>

            <div className="grid items-center gap-10 rounded-[1.4rem] bg-slate-950 px-6 py-12 sm:px-10 sm:py-16 lg:grid-cols-[1.35fr_1fr] lg:gap-8 lg:px-14 lg:py-20">
              <div>
                <h1 className="font-display font-black leading-[0.95] tracking-tight text-amber-50">
                  <span className="block text-6xl sm:text-7xl lg:text-8xl">Hollywood</span>
                  <span className="mt-3 block text-3xl font-semibold italic text-amber-300 sm:text-4xl lg:text-5xl">
                    Cast &amp; Filmography Hub
                  </span>
                </h1>
                <p className="mt-6 max-w-lg text-base leading-relaxed text-zinc-300 sm:text-lg">
                  ค้นหาดาราฮอลลีวูด ดูผลงานภาพยนตร์ของแต่ละคน และเปิดดูหนังที่ทำรายได้สูงสุด ได้ในที่เดียว
                </p>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/actors"
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-amber-500/25 transition duration-300 hover:-translate-y-0.5 hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <Users className="h-5 w-5" aria-hidden />
                    ดูรายชื่อดารา
                  </Link>
                  <Link
                    href="/movies"
                    className="inline-flex items-center gap-2 rounded-xl border border-amber-300/40 px-6 py-3.5 text-base font-semibold text-amber-100 transition duration-300 hover:-translate-y-0.5 hover:border-amber-300 hover:bg-amber-300/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                  >
                    <Film className="h-5 w-5" aria-hidden />
                    ดูภาพยนตร์ทั้งหมด
                  </Link>
                </div>
              </div>

              {/* ตั๋วหนัง: หนังที่ทำรายได้สูงสุดในระบบ */}
              {lead && (
                <Link
                  href={searchHref("/movies", lead.title)}
                  className="group mx-auto block w-full max-w-sm -rotate-2 transition-transform duration-500 hover:rotate-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 motion-reduce:transition-none motion-reduce:hover:-rotate-2 lg:ml-auto lg:mr-0"
                >
                  <div className="relative flex overflow-hidden rounded-xl bg-amber-50 text-slate-900 shadow-2xl shadow-black/60">
                    <div className="w-28 shrink-0 p-3 sm:w-32">
                      <Poster title={lead.title} url={lead.poster_url} className="rounded-md" />
                    </div>
                    <div className="relative flex flex-1 flex-col justify-between gap-4 border-l-2 border-dashed border-slate-900/25 p-4">
                      <span aria-hidden className="absolute -left-[11px] -top-[11px] h-5 w-5 rounded-full bg-slate-950" />
                      <span aria-hidden className="absolute -bottom-[11px] -left-[11px] h-5 w-5 rounded-full bg-slate-950" />
                      <div>
                        <p className="text-xs text-slate-600">ทำรายได้สูงสุดในระบบ</p>
                        <p className="mt-1 line-clamp-2 font-display text-xl font-bold leading-tight">{lead.title}</p>
                      </div>
                      <div>
                        <p className="font-display text-4xl font-black leading-none">{formatGross(lead.box_office_mil)}</p>
                        <p className="mt-1 text-xs text-slate-600">รายได้ทั่วโลก</p>
                        <p className="mt-2 inline-flex items-center gap-1 text-sm font-semibold">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden />
                          {formatRating(lead.rating)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ═════════ Quick Search & Category Nav ═════════ */}
        <section aria-labelledby="quick-search-title" className="mx-auto max-w-7xl px-4 pt-14 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
            <h2 id="quick-search-title" className="font-display text-2xl font-bold text-zinc-900 sm:text-3xl dark:text-zinc-50">
              ค้นหาดาราหรือภาพยนตร์
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              ตอนนี้มีข้อมูลดารา {actorCount} คน และภาพยนตร์ {movieCount} เรื่อง
            </p>

            {/* ปุ่ม 2 ปุ่มใช้ formAction เลือกปลายทาง จึงทำงานได้โดยไม่ต้องใช้ Client JS */}
            <form action="/actors" method="get" role="search" className="mt-5 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <label htmlFor="quick-q" className="sr-only">
                  ชื่อดารา หรือชื่อภาพยนตร์
                </label>
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                  aria-hidden
                />
                <input
                  id="quick-q"
                  name="q"
                  type="search"
                  placeholder="พิมพ์ชื่อดารา หรือชื่อภาพยนตร์"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-3.5 pl-12 pr-4 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:border-zinc-700 dark:bg-slate-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:border-amber-400"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  formAction="/actors"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 motion-reduce:transition-none"
                >
                  <Users className="h-4 w-4" aria-hidden />
                  ค้นหาดารา
                </button>
                <button
                  type="submit"
                  formAction="/movies"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-amber-500/70 px-5 py-3.5 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none dark:border-amber-400/60 dark:text-amber-300 dark:hover:text-slate-950"
                >
                  <Film className="h-4 w-4" aria-hidden />
                  ค้นหาหนัง
                </button>
              </div>
            </form>

            <div className="mt-8 grid gap-8 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">เลือกดูตามแนวหนัง</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {genreCounts.map(({ genre, count }) => (
                    <li key={genre}>
                      <Link href={`/movies?genre=${encodeURIComponent(genre)}`} className={chipClass}>
                        {genre}
                        <span className="text-xs opacity-60">{count}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">เลือกดูตามสัญชาติของดารา</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {nationalities.map((nationality) => (
                    <li key={nationality}>
                      <Link href={`/actors?nationality=${encodeURIComponent(nationality)}`} className={chipClass}>
                        <Globe2 className="h-3.5 w-3.5" aria-hidden />
                        {nationality}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════ Spotlight Actors ═════════ */}
        <section className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
          <SectionHeading
            title="ดาราในสปอตไลต์"
            description="ดาราที่คว้ารางวัลมากที่สุดในระบบ"
            href="/actors"
            cta="ดูดาราทั้งหมด"
          />

          {!topActor ? (
            <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
              ยังไม่มีข้อมูลดารา
            </p>
          ) : (
            <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr]">
              {/* ดาราอันดับ 1: การ์ดใหญ่ ภาพในกรอบทอง */}
              <article className="grid overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm sm:grid-cols-[2fr_3fr] dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
                <div className="p-4 sm:p-5">
                  <div className="rounded-2xl bg-gradient-to-br from-amber-200 via-amber-400 to-amber-700 p-1.5 shadow-lg shadow-amber-500/20">
                    <Avatar
                      name={topActor.name}
                      url={topActor.avatar_url}
                      className="aspect-[4/5] rounded-xl text-6xl"
                    />
                  </div>
                </div>

                <div className="flex flex-col p-5 sm:py-6 sm:pl-1 sm:pr-7">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                    <Award className="h-3.5 w-3.5" aria-hidden />
                    ได้รับรางวัลมากที่สุด
                  </span>
                  <h3 className="mt-3 font-display text-3xl font-bold leading-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
                    {topActor.name}
                  </h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {topActor.nationality ?? "ไม่ระบุสัญชาติ"}
                    {calcAge(topActor.birth_date) !== null && ` อายุ ${calcAge(topActor.birth_date)} ปี`}
                  </p>
                  <p className="mt-4 text-zinc-700 dark:text-zinc-300">
                    คว้ามาแล้ว{" "}
                    <span className="font-display text-3xl font-bold text-amber-600 dark:text-amber-400">
                      {topActor.awards_count}
                    </span>{" "}
                    รางวัล จากภาพยนตร์ {topActor._count.movies} เรื่องในระบบ
                  </p>
                  {topActor.bio && (
                    <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                      {topActor.bio}
                    </p>
                  )}

                  {topActor.movies.length > 0 && (
                    <ul className="mt-5 space-y-2">
                      {topActor.movies.map((movie) => (
                        <li
                          key={movie.id}
                          className="flex items-center justify-between gap-3 rounded-xl bg-zinc-100 px-3 py-2 text-sm dark:bg-slate-950/60"
                        >
                          <span className="truncate font-medium text-zinc-900 dark:text-zinc-100">{movie.title}</span>
                          <span className="inline-flex shrink-0 items-center gap-1 font-semibold text-amber-700 dark:text-amber-300">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" aria-hidden />
                            {formatRating(movie.rating)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Link
                    href={searchHref("/actors", topActor.name)}
                    className="mt-6 inline-flex w-fit items-center rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none"
                  >
                    ดูข้อมูลของ {topActor.name}
                  </Link>
                </div>
              </article>

              {/* ดาราอันดับถัดไป: รายการแถวเรียบ */}
              {otherActors.length > 0 && (
                <ol className="flex flex-col gap-3">
                  {otherActors.map((actor, i) => (
                    <li key={actor.id} className="flex-1">
                      <Link
                        href={searchHref("/actors", actor.name)}
                        className="group flex h-full items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-amber-400/70 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/70"
                      >
                        <span aria-hidden className="w-5 text-center font-display text-xl font-bold text-zinc-400 dark:text-zinc-500">
                          {i + 2}
                        </span>
                        <Avatar
                          name={actor.name}
                          url={actor.avatar_url}
                          className="h-16 w-16 shrink-0 rounded-full text-xl ring-2 ring-amber-500/50"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-display text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            {actor.name}
                          </p>
                          <p className="truncate text-sm text-zinc-600 dark:text-zinc-400">
                            {actor.nationality ?? "ไม่ระบุสัญชาติ"}
                            {actor.movies[0] && ` ผลงานเด่น ${actor.movies[0].title}`}
                          </p>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/15 dark:text-amber-300">
                          <Award className="h-3.5 w-3.5" aria-hidden />
                          {actor.awards_count}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        {/* ═════════ Box Office Blockbusters ═════════ */}
        <section className="mt-20 border-y border-zinc-200 bg-zinc-100 py-16 dark:border-zinc-800 dark:bg-slate-900/60">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <SectionHeading
              title="หนังทำเงินสูงสุด"
              description="เรียงตามรายได้ทั่วโลก เลื่อนดูด้านข้างได้"
              href="/movies"
              cta="ดูภาพยนตร์ทั้งหมด"
            />
          </div>

          {blockbusters.length === 0 ? (
            <p className="mx-4 rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
              ยังไม่มีข้อมูลภาพยนตร์
            </p>
          ) : (
            <ol className="mx-auto flex max-w-7xl snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-6 pt-2 sm:px-6 lg:px-8">
              {blockbusters.map((movie, i) => (
                <li key={movie.id} className="w-40 shrink-0 snap-start sm:w-48 lg:w-52">
                  <Link
                    href={searchHref("/movies", movie.title)}
                    className="group block rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
                  >
                    <div className="relative">
                      <Poster
                        title={movie.title}
                        url={movie.poster_url}
                        className="rounded-xl border border-zinc-200 shadow-md transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-xl motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 dark:border-zinc-800"
                      />
                      <span
                        aria-hidden
                        className="pointer-events-none absolute -bottom-4 -left-2 font-display text-7xl font-black leading-none text-transparent drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)] [-webkit-text-stroke:2px_#fbbf24]"
                      >
                        {i + 1}
                      </span>
                    </div>
                    <div className="mt-7">
                      <p className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{movie.title}</p>
                      <p className="mt-1 flex items-center justify-between text-sm">
                        <span className="font-display text-lg font-bold text-amber-700 dark:text-amber-300">
                          {formatGross(movie.box_office_mil)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                          <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" aria-hidden />
                          {formatRating(movie.rating)}
                        </span>
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ═════════ ปิดท้าย: แสดงตามสถานะผู้ใช้ ═════════ */}
        {(!session || session.role === "ADMIN") && (
          <section className="mx-auto max-w-7xl px-4 pt-16 sm:px-6 lg:px-8">
            <div className="flex flex-col items-start justify-between gap-5 rounded-3xl border border-dashed border-amber-500/50 p-6 sm:flex-row sm:items-center sm:p-8">
              <div className="max-w-xl">
                <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {session ? "จัดการข้อมูลในระบบ" : "สำหรับผู้ดูแลระบบ"}
                </h2>
                <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                  {session
                    ? "เพิ่ม แก้ไข หรือลบข้อมูลดาราและภาพยนตร์ได้ที่แดชบอร์ดหลังบ้าน"
                    : "เข้าสู่ระบบเพื่อเพิ่ม แก้ไข หรือลบข้อมูลดาราและภาพยนตร์"}
                </p>
              </div>
              <Link
                href={session ? "/admin" : "/login"}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 motion-reduce:transition-none"
              >
                {session ? <LayoutDashboard className="h-4 w-4" aria-hidden /> : <LogIn className="h-4 w-4" aria-hidden />}
                {session ? "ไปที่แดชบอร์ด" : "เข้าสู่ระบบ"}
              </Link>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
