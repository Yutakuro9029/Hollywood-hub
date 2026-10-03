import Link from "next/link";
import {
  Award,
  Clapperboard,
  Film,
  Globe2,
  LogIn,
  Search,
  Star,
  X,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { ThemeToggle } from "@/components/theme-toggle";

// ดึงข้อมูลสดจาก MySQL ทุกครั้ง (ไม่ให้ build พยายามต่อ DB ตอน build time)
export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  q?: string;
  nationality?: string;
  genre?: string;
}>;

type MovieSummary = {
  id: number;
  title: string;
  release_year: number | null;
  genre: string | null;
  role_name: string | null;
  rating: number | { toString(): string } | null;
};

type ActorSummary = {
  id: number;
  name: string;
  nationality: string | null;
  birth_date: Date | null;
  bio: string | null;
  avatar_url: string | null;
  awards_count: number;
  _count: {
    movies: number;
  };
  movies: MovieSummary[];
};

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function calcAge(birth: Date | null) {
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const nationality = params.nationality?.trim() ?? "";
  const genre = params.genre?.trim() ?? "";
  const hasFilter = Boolean(q || nationality || genre);

  const [actors, nationalityRows, genreRows] = await Promise.all([
    prisma.actors.findMany({
      where: {
        ...(q ? { name: { contains: q } } : {}),
        ...(nationality ? { nationality } : {}),
        ...(genre ? { movies: { some: { genre: { contains: genre } } } } : {}),
      },
      orderBy: [{ awards_count: "desc" }, { name: "asc" }],
      include: {
        movies: {
          // ถ้ากรองตามแนวหนัง ให้โชว์เฉพาะหนังแนวนั้นในการ์ด
          where: genre ? { genre: { contains: genre } } : undefined,
          orderBy: { rating: "desc" },
          take: 2,
        },
        _count: { select: { movies: true } },
      },
    }) as Promise<ActorSummary[]>,
    prisma.actors.findMany({
      select: { nationality: true },
      where: { nationality: { not: null } },
      distinct: ["nationality"],
      orderBy: { nationality: "asc" },
    }) as Promise<Array<{ nationality: string | null }>>,
    prisma.movies.findMany({
      select: { genre: true },
      where: { genre: { not: null } },
    }) as Promise<Array<{ genre: string | null }>>,
  ]);

  const nationalities: string[] = nationalityRows
    .map((row: { nationality: string | null }) => row.nationality)
    .filter((value: string | null): value is string => Boolean(value));

  // genre ในฐานข้อมูลเก็บเป็นข้อความคั่นด้วย "," เช่น "Sci-Fi, Action" จึงแตกเป็นรายแนว
  const genres: string[] = Array.from(
    new Set(
      genreRows
        .flatMap((row: { genre: string | null }) =>
          (row.genre ?? "").split(","),
        )
        .map((g: string) => g.trim())
        .filter((g: string): g is string => Boolean(g)),
    ),
  ).sort((a: string, b: string) => a.localeCompare(b));

  const selectClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 " +
    "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 " +
    "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:focus:border-amber-400";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-slate-950 dark:text-zinc-100">
      {/* ───────── Top bar ───────── */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/85 backdrop-blur dark:border-zinc-800/80 dark:bg-slate-950/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400"
          >
            <Clapperboard className="h-6 w-6" aria-hidden />
            <span className="text-base sm:text-lg">Hollywood Hub</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/70 px-4 py-2 text-sm font-medium text-amber-700 transition hover:bg-amber-400 hover:text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-amber-400/60 dark:text-amber-300"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              เข้าสู่ระบบ
            </Link>
          </div>
        </div>
      </header>

      {/* ───────── Hero ───────── */}
      <section className="relative overflow-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.18),transparent_60%)] dark:bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.14),transparent_60%)]"
        />
        {/* แถบฟิล์มตกแต่งด้านบนและล่าง */}
        <div
          aria-hidden
          className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(90deg,#fbbf24_0_14px,transparent_14px_28px)] opacity-70"
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl dark:text-zinc-100">
              Hollywood Cast &amp;{" "}
              <span className="text-amber-600 dark:text-amber-400">
                Filmography Hub
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg dark:text-zinc-400">
              รวมข้อมูลดาราฮอลลีวูดและผลงานภาพยนตร์เด่น ค้นหาตามชื่อ สัญชาติ
              หรือแนวหนังที่คุณชอบ
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#cast"
                className="inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
              >
                <Film className="h-4 w-4" aria-hidden />
                ดูรายชื่อดารา
              </a>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-5 py-3 text-sm font-medium text-zinc-700 transition hover:border-amber-500 hover:text-amber-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-amber-400 dark:hover:text-amber-300"
              >
                <LogIn className="h-4 w-4" aria-hidden />
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <main
        id="cast"
        className="mx-auto max-w-7xl scroll-mt-16 px-4 py-10 sm:px-6 lg:px-8"
      >
        {/* ───────── Search & Filter ───────── */}
        {/* ใช้ GET form ธรรมดา: ทำงานได้โดยไม่ต้องมี Client JS และแชร์ลิงก์ผลค้นหาได้ */}
        <form
          action="/"
          method="get"
          role="search"
          className="grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label
              htmlFor="q"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              ชื่อดารา
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
                aria-hidden
              />
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="เช่น Tom Cruise"
                className={`${selectClass} pl-9 placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="nationality"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              สัญชาติ
            </label>
            <select
              id="nationality"
              name="nationality"
              defaultValue={nationality}
              className={selectClass}
            >
              <option value="">ทั้งหมด</option>
              {nationalities.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="genre"
              className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              แนวหนัง
            </label>
            <select
              id="genre"
              name="genre"
              defaultValue={genre}
              className={selectClass}
            >
              <option value="">ทั้งหมด</option>
              {genres.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
            <button
              type="submit"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"
            >
              <Search className="h-4 w-4" aria-hidden />
              ค้นหา
            </button>
            {hasFilter && (
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
                ล้าง
              </Link>
            )}
          </div>
        </form>

        <p
          className="mt-5 text-sm text-zinc-600 dark:text-zinc-400"
          aria-live="polite"
        >
          พบดารา{" "}
          <span className="font-semibold text-amber-700 dark:text-amber-300">
            {actors.length}
          </span>{" "}
          คน
          {hasFilter && " ตามเงื่อนไขที่เลือก"}
        </p>

        {/* ───────── Actor Cards Grid ───────── */}
        {actors.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
            <Search
              className="h-10 w-10 text-zinc-400 dark:text-zinc-600"
              aria-hidden
            />
            <h2 className="mt-4 text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              ไม่พบดาราที่ตรงกับเงื่อนไข
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองแล้วค้นหาใหม่
            </p>
            <Link
              href="/"
              className="mt-5 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              ล้างตัวกรอง
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {actors.map((actor) => {
              const age = calcAge(actor.birth_date);
              return (
                <li key={actor.id}>
                  <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-amber-400/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-amber-400/50">
                    {/* ส่วนหัวการ์ด */}
                    <div className="flex items-center gap-4 p-5">
                      {/* Avatar: ตัวอักษรย่อวางอยู่ใต้รูป ถ้ารูปโหลดไม่ได้ (alt ว่าง) จะเห็นตัวอักษรย่อแทน */}
                      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 ring-2 ring-amber-500/70 dark:from-zinc-800 dark:to-slate-900 dark:ring-amber-400/70">
                        <span
                          aria-hidden
                          className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-amber-600 dark:text-amber-400"
                        >
                          {getInitials(actor.name)}
                        </span>
                        {actor.avatar_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={actor.avatar_url}
                            alt=""
                            loading="lazy"
                            referrerPolicy="no-referrer"
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-zinc-900 dark:text-white">
                          {actor.name}
                        </h2>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
                          <Globe2
                            className="h-3.5 w-3.5 shrink-0"
                            aria-hidden
                          />
                          <span className="truncate">
                            {actor.nationality ?? "ไม่ระบุสัญชาติ"}
                            {age !== null && ` · ${age} ปี`}
                          </span>
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/30 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30">
                            <Award className="h-3.5 w-3.5" aria-hidden />
                            {actor.awards_count} รางวัล
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                            <Film className="h-3.5 w-3.5" aria-hidden />
                            {actor._count.movies} เรื่อง
                          </span>
                        </div>
                      </div>
                    </div>

                    {actor.bio && (
                      <p className="line-clamp-3 px-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                        {actor.bio}
                      </p>
                    )}

                    {/* ภาพยนตร์เด่น 2 เรื่อง */}
                    <div className="mt-auto p-5 pt-4">
                      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                        <Film
                          className="h-4 w-4 text-amber-600 dark:text-amber-400"
                          aria-hidden
                        />
                        ภาพยนตร์เด่น
                      </h3>
                      {actor.movies.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
                          ยังไม่มีข้อมูลภาพยนตร์
                        </p>
                      ) : (
                        <ul className="space-y-2.5">
                          {actor.movies.map((movie) => (
                            <li
                              key={movie.id}
                              className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-slate-950/60"
                            >
                              <div className="min-w-0">
                                <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                                  {movie.title}
                                  {movie.release_year && (
                                    <span className="ml-1.5 text-xs font-normal text-zinc-500">
                                      ({movie.release_year})
                                    </span>
                                  )}
                                </p>
                                <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                                  {movie.genre ?? "ไม่ระบุแนว"}
                                </p>
                                {movie.role_name && (
                                  <p className="mt-0.5 truncate text-xs text-zinc-500">
                                    รับบท {movie.role_name}
                                  </p>
                                )}
                              </div>
                              <span
                                className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                                title="คะแนนจาก 10"
                              >
                                <Star
                                  className="h-4 w-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                                  aria-hidden
                                />
                                {movie.rating !== null
                                  ? Number(movie.rating).toFixed(1)
                                  : "-"}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </article>
                </li>
              );
            })}
          </ul>
        )}
      </main>

      <footer className="mt-10 border-t border-zinc-200 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} Hollywood Cast &amp; Filmography Hub
      </footer>
    </div>
  );
}
