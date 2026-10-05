import type { Metadata } from "next";
import Link from "next/link";
import { Film, Search, X } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getGenreCounts } from "@/lib/catalog";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import { MovieCard } from "@/components/movie-card";
import Pagination from "@/components/pagination";

export const metadata: Metadata = { title: "ภาพยนตร์เด่น | Hollywood Hub" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

type SearchParams = Promise<{
  q?: string;
  genre?: string;
  page?: string;
}>;

const fieldClass =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 " +
  "dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 " +
  "focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/30 dark:focus:border-amber-400";

export default async function MoviesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const genre = params.genre?.trim() ?? "";
  const requestedPage = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const hasFilter = Boolean(q || genre);

  const where = {
    ...(q ? { title: { contains: q } } : {}),
    ...(genre ? { genre: { contains: genre } } : {}),
  };

  const [total, genreCounts] = await Promise.all([
    prisma.movies.count({ where }),
    getGenreCounts(),
  ]);

  const genres = genreCounts
    .map((item) => item.genre)
    .sort((a, b) => a.localeCompare(b));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);

  const movies = await prisma.movies.findMany({
    where,
    orderBy: [{ rating: "desc" }, { title: "asc" }],
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { actors: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-slate-950 dark:text-zinc-100">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Film className="h-8 w-8 text-amber-600 dark:text-amber-400" aria-hidden />
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">ภาพยนตร์เด่น</h1>
        </div>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          ค้นหาภาพยนตร์ตามชื่อ หรือกรองตามแนวหนัง เรียงจากคะแนนสูงสุด
        </p>

        <form
          action="/movies"
          method="get"
          role="search"
          className="mt-6 grid gap-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-[2fr_1fr_auto] lg:items-end dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none"
        >
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="q" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              ชื่อภาพยนตร์
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
                placeholder="เช่น Inception"
                className={`${fieldClass} pl-9 placeholder:text-zinc-400 dark:placeholder:text-zinc-500`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="genre" className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              แนวหนัง
            </label>
            <select id="genre" name="genre" defaultValue={genre} className={fieldClass}>
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
                href="/movies"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2.5 text-sm text-zinc-700 transition hover:border-zinc-400 hover:text-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-500 dark:hover:text-white"
              >
                <X className="h-4 w-4" aria-hidden />
                ล้าง
              </Link>
            )}
          </div>
        </form>

        <p className="mt-5 text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
          พบภาพยนตร์{" "}
          <span className="font-semibold text-amber-700 dark:text-amber-300">{total}</span> เรื่อง
          {hasFilter && " ตามเงื่อนไขที่เลือก"}
          {totalPages > 1 && ` · หน้า ${page} จาก ${totalPages}`}
        </p>

        {movies.length === 0 ? (
          <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
            <Film className="h-10 w-10 text-zinc-400 dark:text-zinc-600" aria-hidden />
            <h2 className="mt-4 text-lg font-semibold">ไม่พบภาพยนตร์ที่ตรงกับเงื่อนไข</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              ลองเปลี่ยนคำค้นหา หรือล้างตัวกรองแล้วค้นหาใหม่
            </p>
            <Link
              href="/movies"
              className="mt-5 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-300"
            >
              ล้างตัวกรอง
            </Link>
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {movies.map((movie) => (
              <li key={movie.id}>
                <MovieCard movie={movie} actorNames={[movie.actors.name]} />
              </li>
            ))}
          </ul>
        )}

        <Pagination page={page} totalPages={totalPages} basePath="/movies" params={{ q, genre }} />
      </main>

      <SiteFooter />
    </div>
  );
}
