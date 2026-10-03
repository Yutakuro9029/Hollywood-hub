import Link from "next/link";
import {
  Users,
  Film,
  DollarSign,
  Trophy,
  Star,
  ArrowRight,
  Clapperboard,
  UserCog,
  Globe2,
  Tags,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { btnPrimary } from "@/components/admin/field";

export const dynamic = "force-dynamic";

/* ---------- helpers ---------- */

const card =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-slate-900";

const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

/** นับจำนวนตามคีย์ แล้วเรียงมากไปน้อย */
function tally(items: string[]): { label: string; count: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/* ---------- data ---------- */

async function getDashboardData() {
  const [
    actorCount,
    movieCount,
    boxOfficeAgg,
    awardsAgg,
    ratingAgg,
    topMovies,
    topActors,
    genreRows,
    nationalityRows,
  ] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movies.aggregate({ _sum: { box_office_mil: true } }),
    prisma.actors.aggregate({ _sum: { awards_count: true } }),
    prisma.movies.aggregate({ _avg: { rating: true } }),
    prisma.movies.findMany({
      orderBy: [{ box_office_mil: "desc" }, { id: "asc" }],
      take: 5,
      include: { actors: { select: { id: true, name: true } } },
    }),
    prisma.actors.findMany({
      orderBy: [{ awards_count: "desc" }, { id: "asc" }],
      take: 5,
      include: { _count: { select: { movies: true } } },
    }),
    prisma.movies.findMany({ select: { genre: true } }),
    prisma.actors.groupBy({
      by: ["nationality"],
      _count: { _all: true },
      orderBy: { _count: { nationality: "desc" } },
    }),
  ]);

  // Decimal (Prisma) -> number เพื่อนำไปแสดงผล
  const totalBoxOffice = Number(boxOfficeAgg._sum.box_office_mil ?? 0);
  const totalAwards = awardsAgg._sum.awards_count ?? 0;
  const avgRating =
    ratingAgg._avg.rating !== null ? Number(ratingAgg._avg.rating) : null;

  // genre เก็บเป็นสตริงคั่นด้วย comma เช่น "Sci-Fi, Action, Thriller"
  const genres = tally(
    genreRows.flatMap((m) =>
      (m.genre ?? "")
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean),
    ),
  );

  const nationalities = nationalityRows.map((r) => ({
    label: r.nationality ?? "ไม่ระบุ",
    count: r._count._all,
  }));

  return {
    actorCount,
    movieCount,
    totalBoxOffice,
    totalAwards,
    avgRating,
    topMovies,
    topActors,
    genres,
    nationalities,
  };
}

/* ---------- small components ---------- */

function KpiCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  tone: string;
}) {
  return (
    <div className={`${card} flex items-center gap-4 p-5`}>
      <div className={`rounded-lg p-3 ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-2xl font-bold">
          {value}
          {suffix && (
            <span className="ml-1 text-sm font-medium text-zinc-500 dark:text-zinc-400">
              {suffix}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const style =
    rank === 1
      ? "bg-amber-400 text-zinc-900"
      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300";
  return (
    <span
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${style}`}
    >
      {rank}
    </span>
  );
}

function Thumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className: string;
}) {
  if (!src) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-zinc-100 text-zinc-400 dark:bg-zinc-800`}
        aria-hidden
      >
        <Film size={16} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- URL ภายนอกจากฐานข้อมูล ไม่ต้องตั้งค่า remotePatterns
  return <img src={src} alt={alt} loading="lazy" className={`${className} object-cover`} />;
}

function BarList({
  rows,
  barClass,
}: {
  rows: { label: string; count: number }[];
  barClass: string;
}) {
  const total = rows.reduce((s, r) => s + r.count, 0);
  const max = Math.max(...rows.map((r) => r.count), 1);

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-500">ยังไม่มีข้อมูล</p>;
  }

  return (
    <ul className="space-y-3">
      {rows.map((r) => (
        <li key={r.label}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate pr-2">{r.label}</span>
            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">
              {r.count} ({fmtNumber((r.count / total) * 100, 0)}%)
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${barClass}`}
              style={{ width: `${(r.count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ---------- page ---------- */

export default async function AdminDashboardPage() {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงต้องเช็กสิทธิ์ซ้ำในหน้านี้ด้วย
  await requireAdmin();

  const {
    actorCount,
    movieCount,
    totalBoxOffice,
    totalAwards,
    avgRating,
    topMovies,
    topActors,
    genres,
    nationalities,
  } = await getDashboardData();

  const topGenres = genres.slice(0, 8);

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            สรุปสถิติและภาพรวมของ Hollywood Stars &amp; Filmography Hub
          </p>
        </div>

        {/* Quick Actions */}
        <nav className="flex flex-wrap gap-2" aria-label="Quick actions">
          <Link href="/admin/actors" className={btnPrimary}>
            <UserCog size={16} /> จัดการดารา
          </Link>
          <Link href="/admin/movies" className={btnSecondary}>
            <Clapperboard size={16} /> จัดการภาพยนตร์
          </Link>
        </nav>
      </header>

      {/* KPI Cards */}
      <section
        aria-label="KPI"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <KpiCard
          label="ดาราทั้งหมด"
          value={fmtNumber(actorCount)}
          icon={Users}
          tone="bg-sky-500/10 text-sky-500"
        />
        <KpiCard
          label="ภาพยนตร์ทั้งหมด"
          value={fmtNumber(movieCount)}
          icon={Film}
          tone="bg-violet-500/10 text-violet-500"
        />
        <KpiCard
          label="Box Office รวม"
          value={`$${fmtNumber(totalBoxOffice, 1)}`}
          suffix="M"
          icon={DollarSign}
          tone="bg-emerald-500/10 text-emerald-500"
        />
        <KpiCard
          label="รางวัลรวม"
          value={fmtNumber(totalAwards)}
          icon={Trophy}
          tone="bg-amber-400/10 text-amber-500"
        />
        <KpiCard
          label="เรตติ้งเฉลี่ย"
          value={avgRating !== null ? avgRating.toFixed(2) : "-"}
          suffix="/ 10"
          icon={Star}
          tone="bg-rose-500/10 text-rose-500"
        />
      </section>

      {/* Top Performers */}
      <section className="grid gap-6 2xl:grid-cols-2">
        {/* Top 5 Box Office */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="flex items-center gap-2 font-semibold">
              <DollarSign size={18} className="text-emerald-500" />
              Top 5 ภาพยนตร์ทำเงินสูงสุด
            </h2>
            <Link
              href="/admin/movies"
              className="inline-flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400"
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>

          {topMovies.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลภาพยนตร์</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className="px-2 py-3 font-medium">ภาพยนตร์</th>
                    <th className="px-2 py-3 font-medium">ดารา</th>
                    <th className="px-2 py-3 font-medium">ปี</th>
                    <th className="px-2 py-3 text-right font-medium">Box Office</th>
                    <th className="px-5 py-3 text-right font-medium">เรตติ้ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {topMovies.map((m, i) => (
                    <tr
                      key={m.id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-3">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={m.poster_url}
                            alt={m.title}
                            className="h-14 w-10 shrink-0 rounded"
                          />
                          <span className="font-medium">{m.title}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">
                        {m.actors.name}
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">
                        {m.release_year ?? "-"}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-emerald-500">
                        ${fmtNumber(Number(m.box_office_mil), 1)}M
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1">
                          <Star size={14} className="fill-amber-400 text-amber-400" />
                          {m.rating !== null ? Number(m.rating).toFixed(1) : "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Top 5 Awarded Actors */}
        <div className={`${card} overflow-hidden`}>
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
            <h2 className="flex items-center gap-2 font-semibold">
              <Trophy size={18} className="text-amber-400" />
              Top 5 ดาราที่ได้รับรางวัลสูงสุด
            </h2>
            <Link
              href="/admin/actors"
              className="inline-flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400"
            >
              ดูทั้งหมด <ArrowRight size={14} />
            </Link>
          </div>

          {topActors.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className="px-2 py-3 font-medium">ดารา</th>
                    <th className="px-2 py-3 font-medium">สัญชาติ</th>
                    <th className="px-2 py-3 text-right font-medium">รางวัล</th>
                    <th className="px-5 py-3 text-right font-medium">หนังในระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {topActors.map((a, i) => (
                    <tr
                      key={a.id}
                      className="transition hover:bg-zinc-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-3">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb
                            src={a.avatar_url}
                            alt={a.name}
                            className="h-10 w-10 shrink-0 rounded-full"
                          />
                          <span className="font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">
                        {a.nationality ?? "-"}
                      </td>
                      <td className="px-2 py-3 text-right font-semibold text-amber-500">
                        {fmtNumber(a.awards_count)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        {fmtNumber(a._count.movies)} เรื่อง
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Summary: Genre & Nationality */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className={`${card} p-5`}>
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Tags size={18} className="text-violet-500" />
            สัดส่วนภาพยนตร์ตามประเภท (Genre)
          </h2>
          <BarList rows={topGenres} barClass="bg-violet-500" />
          {genres.length > topGenres.length && (
            <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
              แสดง {topGenres.length} จาก {genres.length} ประเภท · หนังหนึ่งเรื่องอาจนับได้หลายประเภท
            </p>
          )}
        </div>

        <div className={`${card} p-5`}>
          <h2 className="mb-4 flex items-center gap-2 font-semibold">
            <Globe2 size={18} className="text-sky-500" />
            ดาราตามสัญชาติ
          </h2>
          <BarList rows={nationalities} barClass="bg-sky-500" />
        </div>
      </section>
    </div>
  );
}
