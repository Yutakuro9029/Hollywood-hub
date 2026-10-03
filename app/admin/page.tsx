import Link from "next/link";
import {
  Activity,
  BarChart3,
  Calendar,
  Clapperboard,
  Crown,
  DollarSign,
  ExternalLink,
  Film,
  Sparkles,
  Star,
  Trophy,
  UserCog,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getOverviewData } from "@/lib/dashboard-data";
import { fmtMoney, fmtNumber, nowTh } from "@/lib/format";
import {
  Highlight,
  KpiCard,
  MiniStat,
  NavCard,
  PageHeader,
  Panel,
  RankBadge,
  Thumb,
  quickBtn,
  rowCls,
} from "@/components/admin/dashboard-ui";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงต้องเช็กสิทธิ์ซ้ำในหน้านี้ด้วย
  await requireAdmin();
  const d = await getOverviewData();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="สรุปสถิติและภาพรวมของ Hollywood Stars & Filmography Hub — เลือกดูรายละเอียดเชิงลึกได้จากแท็บด้านล่าง"
        updatedAt={nowTh()}
        actions={
          <>
            <Link href="/admin/actors" className={quickBtn}>
              <UserCog size={16} /> จัดการดารา
            </Link>
            <Link href="/admin/movies" className={quickBtn}>
              <Clapperboard size={16} /> จัดการภาพยนตร์
            </Link>
            <Link href="/" className={quickBtn}>
              <ExternalLink size={16} /> ดูหน้าเว็บไซต์
            </Link>
          </>
        }
      />

      {/* KPI */}
      <section aria-label="KPI" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="ดาราทั้งหมด" value={fmtNumber(d.actorCount)} icon={Users}
          gradient="from-sky-400 to-sky-600 shadow-sky-500/30" />
        <KpiCard label="ภาพยนตร์ทั้งหมด" value={fmtNumber(d.movieCount)} icon={Film}
          gradient="from-violet-400 to-violet-600 shadow-violet-500/30" />
        <KpiCard label="Box Office รวม" value={`$${fmtNumber(d.totalBoxOffice, 1)}`} suffix="M" icon={DollarSign}
          gradient="from-emerald-400 to-emerald-600 shadow-emerald-500/30" />
        <KpiCard label="รางวัลรวม" value={fmtNumber(d.totalAwards)} icon={Trophy}
          gradient="from-amber-300 to-amber-500 shadow-amber-500/30" />
        <KpiCard label="เรตติ้งเฉลี่ย" value={d.avgRating !== null ? d.avgRating.toFixed(2) : "-"} suffix="/ 10"
          icon={Star} gradient="from-rose-400 to-rose-600 shadow-rose-500/30" />
      </section>

      {/* Mini stats */}
      <section aria-label="สถิติเฉลี่ย" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MiniStat label="Box Office เฉลี่ย / เรื่อง" value={fmtMoney(d.avgBoxPerMovie)} />
        <MiniStat label="รางวัลเฉลี่ย / ดารา" value={fmtNumber(d.avgAwardsPerActor, 1)} />
        <MiniStat label="หนังเฉลี่ย / ดารา" value={fmtNumber(d.avgMoviesPerActor, 1)} />
        <MiniStat label="ความหลากหลาย" value={`${d.genreCount} ประเภท`} hint={`${d.nationalityCount} สัญชาติ`} />
      </section>

      {/* Highlights */}
      <section aria-label="ไฮไลต์" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Highlight icon={Crown} tone="bg-amber-400/10 text-amber-500" label="เรตติ้งสูงสุด"
          title={d.topRated?.title ?? "-"}
          sub={d.topRated ? `★ ${Number(d.topRated.rating).toFixed(1)} · ${d.topRated.release_year ?? "-"}` : "-"} />
        <Highlight icon={Sparkles} tone="bg-sky-500/10 text-sky-500" label="หนังใหม่ที่สุด"
          title={d.newest?.title ?? "-"} sub={d.newest ? `ปี ${d.newest.release_year}` : "-"} />
        <Highlight icon={Calendar} tone="bg-violet-500/10 text-violet-500" label="หนังเก่าที่สุด"
          title={d.oldest?.title ?? "-"} sub={d.oldest ? `ปี ${d.oldest.release_year}` : "-"} />
        <Highlight icon={Activity} tone="bg-emerald-500/10 text-emerald-500" label="ดาราที่มีหนังมากที่สุด"
          title={d.mostProlific?.name ?? "-"}
          sub={d.mostProlific ? `${d.mostProlific._count.movies} เรื่อง · ${d.mostProlific.awards_count} รางวัล` : "-"} />
      </section>

      {/* Top 3 สั้นๆ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Top 3 ภาพยนตร์ทำเงินสูงสุด" icon={DollarSign} tone="text-emerald-500"
          href="/admin/rankings" hrefLabel="ดูอันดับทั้งหมด">
          {d.top3Movies.length === 0 ? (
            <p className="text-sm text-zinc-500">ยังไม่มีข้อมูลภาพยนตร์</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
              {d.top3Movies.map((m, i) => (
                <li key={m.id} className={`flex items-center gap-3 rounded-lg py-3 ${rowCls}`}>
                  <RankBadge rank={i + 1} />
                  <Thumb src={m.poster_url} alt={m.title} className="h-14 w-10 shrink-0 rounded" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {m.actors.name} · {m.release_year ?? "-"}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-emerald-500">
                    {fmtMoney(Number(m.box_office_mil))}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Top 3 ดาราที่ได้รับรางวัลสูงสุด" icon={Trophy} tone="text-amber-400"
          href="/admin/rankings" hrefLabel="ดูอันดับทั้งหมด">
          {d.top3Actors.length === 0 ? (
            <p className="text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
          ) : (
            <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
              {d.top3Actors.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-3 rounded-lg py-3 ${rowCls}`}>
                  <RankBadge rank={i + 1} />
                  <Thumb src={a.avatar_url} alt={a.name} className="h-11 w-11 shrink-0 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{a.name}</p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {a.nationality ?? "ไม่ระบุสัญชาติ"} · {a._count.movies} เรื่อง
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold text-amber-500">
                    {fmtNumber(a.awards_count)} รางวัล
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* ลิงก์ไปหน้าย่อย */}
      <section aria-label="หน้าย่อยของ Dashboard" className="grid gap-4 md:grid-cols-3">
        <NavCard href="/admin/analytics" icon={BarChart3} title="วิเคราะห์เชิงกราฟ"
          description="กราฟ interactive 9 แบบ กรองตามดารา/ประเภท ซูมช่วงปี"
          gradient="from-amber-300 to-amber-500 shadow-amber-500/30" />
        <NavCard href="/admin/rankings" icon={Trophy} title="อันดับ & ผลงาน"
          description="Top 5 หนังทำเงิน ดาราได้รางวัล หนังเรตติ้งสูง และตารางผลงานดารา"
          gradient="from-emerald-400 to-emerald-600 shadow-emerald-500/30" />
        <NavCard href="/admin/insights" icon={Activity} title="ข้อมูลล่าสุด & คุณภาพ"
          description="รายการที่เพิ่มล่าสุด คะแนนความครบถ้วนของข้อมูล และสัดส่วนประเภท/สัญชาติ"
          gradient="from-sky-400 to-sky-600 shadow-sky-500/30" />
      </section>
    </div>
  );
}
