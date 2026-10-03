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
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Crown,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import { btnPrimary } from "@/components/admin/field";
import DashboardCharts from "@/components/admin/dashboard-charts";

export const dynamic = "force-dynamic";

/* ======================================================================
 * Helpers
 * ==================================================================== */

type Icon = React.ComponentType<{ size?: number; className?: string }>;

const card =
  "rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-slate-900";

const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800";

const fmtNumber = (n: number, digits = 0) =>
  n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** ล้านดอลลาร์ -> $850M / $1.45B */
const fmtMoney = (m: number) =>
  m >= 1000 ? `$${fmtNumber(m / 1000, 2)}B` : `$${fmtNumber(m, m < 100 ? 1 : 0)}M`;

const avg = (xs: number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);

function tally(items: string[]): { label: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

/* ======================================================================
 * Data
 * ==================================================================== */

async function getDashboardData() {
  const [
    actorCount,
    movieCount,
    boxOfficeAgg,
    awardsAgg,
    ratingAgg,
    topMovies,
    topActors,
    movieRows,
    actorRows,
    recentMovies,
    recentActors,
    noBio,
    noAvatar,
    noBirth,
    noMovies,
    noPoster,
    noRating,
    noGenre,
  ] = await Promise.all([
    // --- KPI หลัก ---
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movies.aggregate({ _sum: { box_office_mil: true } }),
    prisma.actors.aggregate({ _sum: { awards_count: true } }),
    prisma.movies.aggregate({ _avg: { rating: true } }),

    // --- Top 5 ---
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

    // --- แถวแบบเบาสำหรับคำนวณกราฟ (ไม่ดึง bio/poster ที่เป็นข้อความยาว) ---
    prisma.movies.findMany({
      select: {
        id: true,
        title: true,
        actor_id: true,
        genre: true,
        release_year: true,
        box_office_mil: true,
        rating: true,
      },
    }),
    prisma.actors.findMany({
      select: {
        id: true,
        name: true,
        nationality: true,
        awards_count: true,
        _count: { select: { movies: true } },
      },
    }),

    // --- รายการล่าสุด ---
    prisma.movies.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 5,
      include: { actors: { select: { name: true } } },
    }),
    prisma.actors.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 5,
      select: { id: true, name: true, nationality: true, avatar_url: true, created_at: true },
    }),

    // --- ตรวจคุณภาพข้อมูล ---
    prisma.actors.count({ where: { bio: null } }),
    prisma.actors.count({ where: { avatar_url: null } }),
    prisma.actors.count({ where: { birth_date: null } }),
    prisma.actors.count({ where: { movies: { none: {} } } }),
    prisma.movies.count({ where: { poster_url: null } }),
    prisma.movies.count({ where: { rating: null } }),
    prisma.movies.count({ where: { genre: null } }),
  ]);

  // Decimal -> number
  const movies = movieRows.map((m) => ({
    ...m,
    box: Number(m.box_office_mil),
    rate: m.rating === null ? null : Number(m.rating),
  }));

  const totalBoxOffice = Number(boxOfficeAgg._sum.box_office_mil ?? 0);
  const totalAwards = awardsAgg._sum.awards_count ?? 0;
  const avgRating = ratingAgg._avg.rating === null ? null : Number(ratingAgg._avg.rating);

  /* ---- แยกตามดารา ---- */
  const moviesByActor = new Map<number, typeof movies>();
  for (const m of movies) {
    const list = moviesByActor.get(m.actor_id) ?? [];
    list.push(m);
    moviesByActor.set(m.actor_id, list);
  }
  const perActor = actorRows
    .map((a) => {
      const ms = moviesByActor.get(a.id) ?? [];
      return {
        id: a.id,
        name: a.name,
        nationality: a.nationality,
        awards: a.awards_count,
        movieCount: a._count.movies,
        box: ms.reduce((s, m) => s + m.box, 0),
        avgRating: avg(ms.flatMap((m) => (m.rate === null ? [] : [m.rate]))),
      };
    })
    .sort((a, b) => b.box - a.box || a.name.localeCompare(b.name));

  /* ---- Genre / สัญชาติ (ใช้นับความหลากหลาย) ---- */
  const genres = tally(
    movies.flatMap((m) => (m.genre ?? "").split(",").map((g) => g.trim()).filter(Boolean)),
  );
  const nationalities = tally(actorRows.map((a) => a.nationality ?? "ไม่ระบุ"));
  const rated = movies.flatMap((m) => (m.rate === null ? [] : [{ ...m, rate: m.rate }]));

  /* ---- ข้อมูลส่งให้กราฟ interactive (Client Component) ---- */
  const chartMovies = movies.map((m) => ({
    id: m.id,
    title: m.title,
    actorId: m.actor_id,
    genres: (m.genre ?? "").split(",").map((g) => g.trim()).filter(Boolean),
    year: m.release_year,
    box: m.box,
    rating: m.rate,
  }));
  const chartActors = actorRows.map((a) => ({
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    awards: a.awards_count,
  }));

  /* ---- ไฮไลต์ ---- */
  const topRated = [...rated].sort((a, b) => b.rate - a.rate || b.box - a.box)[0] ?? null;
  const dated = movies.filter((m) => m.release_year !== null);
  const oldest = [...dated].sort((a, b) => a.release_year! - b.release_year!)[0] ?? null;
  const newest = [...dated].sort((a, b) => b.release_year! - a.release_year!)[0] ?? null;
  const mostProlific =
    [...perActor].sort((a, b) => b.movieCount - a.movieCount || b.box - a.box)[0] ?? null;

  return {
    actorCount,
    movieCount,
    totalBoxOffice,
    totalAwards,
    avgRating,
    topMovies,
    topActors,
    perActor,
    genres,
    nationalities,
    chartMovies,
    chartActors,
    topRated,
    oldest,
    newest,
    mostProlific,
    recentMovies,
    recentActors,
    health: { noBio, noAvatar, noBirth, noMovies, noPoster, noRating, noGenre },
  };
}

/* ======================================================================
 * Small components
 * ==================================================================== */

function KpiCard({
  label, value, suffix, icon: Icon, tone,
}: { label: string; value: string; suffix?: string; icon: Icon; tone: string }) {
  return (
    <div className={`${card} flex items-center gap-4 p-5`}>
      <div className={`rounded-lg p-3 ${tone}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate text-2xl font-bold tabular-nums">
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

function MiniStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${card} px-4 py-3`}>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
      {hint && <p className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</p>}
    </div>
  );
}

function Panel({
  title, icon: Icon, tone = "text-amber-400", subtitle, href, hrefLabel = "ดูทั้งหมด",
  className = "", children,
}: {
  title: string;
  icon: Icon;
  tone?: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`${card} flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 border-b border-zinc-200 px-5 py-4 dark:border-zinc-800">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <Icon size={18} className={tone} />
            <span className="truncate">{title}</span>
          </h2>
          {subtitle && (
            <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="inline-flex shrink-0 items-center gap-1 text-sm text-amber-500 hover:text-amber-400"
          >
            {hrefLabel} <ArrowRight size={14} />
          </Link>
        )}
      </div>
      <div className="flex-1 p-5">{children}</div>
    </section>
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

function Thumb({ src, alt, className }: { src: string | null; alt: string; className: string }) {
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

function Highlight({
  icon: Icon, label, title, sub, tone,
}: { icon: Icon; label: string; title: string; sub: string; tone: string }) {
  return (
    <div className={`${card} flex items-start gap-3 p-4`}>
      <div className={`rounded-lg p-2.5 ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="truncate font-semibold">{title}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{sub}</p>
      </div>
    </div>
  );
}

function HealthRow({ label, count, href }: { label: string; count: number; href: string }) {
  const ok = count === 0;
  return (
    <li className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="flex min-w-0 items-center gap-2">
        {ok ? (
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
        ) : (
          <AlertTriangle size={16} className="shrink-0 text-amber-500" />
        )}
        <span className="truncate">{label}</span>
      </span>
      {ok ? (
        <span className="shrink-0 text-xs text-emerald-500">ครบถ้วน</span>
      ) : (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-500 hover:text-amber-400"
        >
          {count} รายการ <ExternalLink size={12} />
        </Link>
      )}
    </li>
  );
}

const th = "px-2 py-3 font-medium";

/* ======================================================================
 * Page
 * ==================================================================== */

export default async function AdminDashboardPage() {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงต้องเช็กสิทธิ์ซ้ำในหน้านี้ด้วย
  await requireAdmin();

  const d = await getDashboardData();

  const avgBoxPerMovie = d.movieCount ? d.totalBoxOffice / d.movieCount : 0;
  const avgAwardsPerActor = d.actorCount ? d.totalAwards / d.actorCount : 0;
  const avgMoviesPerActor = d.actorCount ? d.movieCount / d.actorCount : 0;

  const updatedAt = new Date().toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });

  const h = d.health;
  const healthIssues = Object.values(h).reduce((s, n) => s + n, 0);

  return (
    <div className="space-y-8">
      {/* ---------------- Header ---------------- */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">Dashboard</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-zinc-500 dark:text-zinc-400">
            <span>สรุปสถิติและภาพรวมของ Hollywood Stars &amp; Filmography Hub</span>
            <span className="inline-flex items-center gap-1 text-xs">
              <Clock size={12} /> อัปเดต {updatedAt}
            </span>
          </p>
        </div>

        <nav className="flex flex-wrap gap-2" aria-label="Quick actions">
          <Link href="/admin/actors" className={btnPrimary}>
            <UserCog size={16} /> จัดการดารา
          </Link>
          <Link href="/admin/movies" className={btnSecondary}>
            <Clapperboard size={16} /> จัดการภาพยนตร์
          </Link>
          <Link href="/" className={btnSecondary}>
            <ExternalLink size={16} /> ดูหน้าเว็บไซต์
          </Link>
        </nav>
      </header>

      {/* ---------------- KPI ---------------- */}
      <section aria-label="KPI" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="ดาราทั้งหมด" value={fmtNumber(d.actorCount)} icon={Users}
          tone="bg-sky-500/10 text-sky-500" />
        <KpiCard label="ภาพยนตร์ทั้งหมด" value={fmtNumber(d.movieCount)} icon={Film}
          tone="bg-violet-500/10 text-violet-500" />
        <KpiCard label="Box Office รวม" value={`$${fmtNumber(d.totalBoxOffice, 1)}`} suffix="M"
          icon={DollarSign} tone="bg-emerald-500/10 text-emerald-500" />
        <KpiCard label="รางวัลรวม" value={fmtNumber(d.totalAwards)} icon={Trophy}
          tone="bg-amber-400/10 text-amber-500" />
        <KpiCard label="เรตติ้งเฉลี่ย" value={d.avgRating !== null ? d.avgRating.toFixed(2) : "-"}
          suffix="/ 10" icon={Star} tone="bg-rose-500/10 text-rose-500" />
      </section>

      {/* ---------------- Mini stats ---------------- */}
      <section aria-label="สถิติเฉลี่ย" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Box Office เฉลี่ย / เรื่อง" value={fmtMoney(avgBoxPerMovie)} />
        <MiniStat label="รางวัลเฉลี่ย / ดารา" value={fmtNumber(avgAwardsPerActor, 1)} />
        <MiniStat label="หนังเฉลี่ย / ดารา" value={fmtNumber(avgMoviesPerActor, 1)} />
        <MiniStat
          label="ความหลากหลาย"
          value={`${d.genres.length} ประเภท`}
          hint={`${d.nationalities.length} สัญชาติ`}
        />
      </section>

      {/* ---------------- Highlights ---------------- */}
      <section aria-label="ไฮไลต์" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Highlight
          icon={Crown}
          tone="bg-amber-400/10 text-amber-500"
          label="เรตติ้งสูงสุด"
          title={d.topRated?.title ?? "-"}
          sub={d.topRated ? `★ ${d.topRated.rate.toFixed(1)} · ${d.topRated.release_year ?? "-"}` : "-"}
        />
        <Highlight
          icon={Sparkles}
          tone="bg-sky-500/10 text-sky-500"
          label="หนังใหม่ที่สุด"
          title={d.newest?.title ?? "-"}
          sub={d.newest ? `ปี ${d.newest.release_year}` : "-"}
        />
        <Highlight
          icon={Calendar}
          tone="bg-violet-500/10 text-violet-500"
          label="หนังเก่าที่สุด"
          title={d.oldest?.title ?? "-"}
          sub={d.oldest ? `ปี ${d.oldest.release_year}` : "-"}
        />
        <Highlight
          icon={Activity}
          tone="bg-emerald-500/10 text-emerald-500"
          label="ดาราที่มีหนังมากที่สุด"
          title={d.mostProlific?.name ?? "-"}
          sub={d.mostProlific ? `${d.mostProlific.movieCount} เรื่อง · ${fmtMoney(d.mostProlific.box)}` : "-"}
        />
      </section>

      {/* ---------------- Interactive charts (Recharts) ---------------- */}
      <DashboardCharts movies={d.chartMovies} actors={d.chartActors} />

      {/* ---------------- Top 5 tables ---------------- */}
      <div className="grid gap-6 2xl:grid-cols-2">
        <Panel title="Top 5 ภาพยนตร์ทำเงินสูงสุด" icon={DollarSign} tone="text-emerald-500"
          href="/admin/movies" className="overflow-hidden [&>div:last-child]:p-0">
          {d.topMovies.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลภาพยนตร์</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className={th}>ภาพยนตร์</th>
                    <th className={th}>ดารา</th>
                    <th className={th}>ปี</th>
                    <th className={`${th} text-right`}>Box Office</th>
                    <th className="px-5 py-3 text-right font-medium">เรตติ้ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.topMovies.map((m, i) => (
                    <tr key={m.id} className="transition hover:bg-zinc-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3"><RankBadge rank={i + 1} /></td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={m.poster_url} alt={m.title} className="h-14 w-10 shrink-0 rounded" />
                          <span className="font-medium">{m.title}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{m.actors.name}</td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{m.release_year ?? "-"}</td>
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
        </Panel>

        <Panel title="Top 5 ดาราที่ได้รับรางวัลสูงสุด" icon={Trophy} tone="text-amber-400"
          href="/admin/actors" className="overflow-hidden [&>div:last-child]:p-0">
          {d.topActors.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className={th}>ดารา</th>
                    <th className={th}>สัญชาติ</th>
                    <th className={`${th} text-right`}>รางวัล</th>
                    <th className="px-5 py-3 text-right font-medium">หนังในระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.topActors.map((a, i) => (
                    <tr key={a.id} className="transition hover:bg-zinc-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3"><RankBadge rank={i + 1} /></td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={a.avatar_url} alt={a.name} className="h-10 w-10 shrink-0 rounded-full" />
                          <span className="font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{a.nationality ?? "-"}</td>
                      <td className="px-2 py-3 text-right font-semibold text-amber-500">
                        {fmtNumber(a.awards_count)}
                      </td>
                      <td className="px-5 py-3 text-right">{fmtNumber(a._count.movies)} เรื่อง</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* ---------------- Actor performance ---------------- */}
      <Panel title="ตารางผลงานดาราโดยรวม" subtitle="เรียงตาม Box Office รวม (สูงสุด 10 คน)"
        icon={Users} tone="text-sky-500" href="/admin/actors"
        className="overflow-hidden [&>div:last-child]:p-0">
        {d.perActor.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-medium">ดารา</th>
                  <th className={th}>สัญชาติ</th>
                  <th className={`${th} text-right`}>หนัง</th>
                  <th className={`${th} w-56`}>Box Office รวม</th>
                  <th className={`${th} text-right`}>เรตติ้งเฉลี่ย</th>
                  <th className="px-5 py-3 text-right font-medium">รางวัล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {d.perActor.slice(0, 10).map((a) => {
                  const maxBox = d.perActor[0]?.box || 1;
                  return (
                    <tr key={a.id} className="transition hover:bg-zinc-50 dark:hover:bg-slate-800/50">
                      <td className="px-5 py-3 font-medium">{a.name}</td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{a.nationality ?? "-"}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{a.movieCount}</td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-emerald-500"
                              style={{ width: `${(a.box / maxBox) * 100}%` }}
                            />
                          </div>
                          <span className="w-16 shrink-0 text-right text-xs tabular-nums">
                            {fmtMoney(a.box)}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">
                        {a.avgRating !== null ? a.avgRating.toFixed(2) : "-"}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold tabular-nums text-amber-500">
                        {fmtNumber(a.awards)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {/* ---------------- Recent + Data health ---------------- */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="ภาพยนตร์ที่เพิ่มล่าสุด" icon={Film} tone="text-violet-500" href="/admin/movies">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentMovies.map((m) => (
              <li key={m.id} className="flex items-center gap-3 py-2.5">
                <Thumb src={m.poster_url} alt={m.title} className="h-12 w-8 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {m.actors.name} · {m.release_year ?? "-"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {m.created_at.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" })}
                </span>
              </li>
            ))}
            {d.recentMovies.length === 0 && (
              <li className="py-4 text-sm text-zinc-500">ยังไม่มีข้อมูล</li>
            )}
          </ul>
        </Panel>

        <Panel title="ดาราที่เพิ่มล่าสุด" icon={Users} tone="text-sky-500" href="/admin/actors">
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentActors.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <Thumb src={a.avatar_url} alt={a.name} className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {a.nationality ?? "ไม่ระบุสัญชาติ"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                  {a.created_at.toLocaleDateString("th-TH", { dateStyle: "medium", timeZone: "Asia/Bangkok" })}
                </span>
              </li>
            ))}
            {d.recentActors.length === 0 && (
              <li className="py-4 text-sm text-zinc-500">ยังไม่มีข้อมูล</li>
            )}
          </ul>
        </Panel>

        <Panel
          title="ตรวจสอบความครบถ้วนของข้อมูล"
          subtitle={healthIssues === 0 ? "ข้อมูลครบถ้วนทุกรายการ" : `พบ ${healthIssues} รายการที่ควรเติมข้อมูล`}
          icon={healthIssues === 0 ? CheckCircle2 : AlertTriangle}
          tone={healthIssues === 0 ? "text-emerald-500" : "text-amber-500"}
        >
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            <HealthRow label="ดาราที่ยังไม่มีรูปโปรไฟล์" count={h.noAvatar} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่มีประวัติ (bio)" count={h.noBio} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่ระบุวันเกิด" count={h.noBirth} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่มีหนังในระบบ" count={h.noMovies} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่มีโปสเตอร์" count={h.noPoster} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่มีคะแนนเรตติ้ง" count={h.noRating} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่ระบุประเภท" count={h.noGenre} href="/admin/movies" />
          </ul>
        </Panel>
      </div>
    </div>
  );
}
