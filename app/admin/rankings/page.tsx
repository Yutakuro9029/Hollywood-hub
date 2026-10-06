import Link from "next/link";
import { DollarSign, Medal, Star, Trophy, Users } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getRankingsData } from "@/lib/dashboard-data";
import { fmtMoney, fmtNumber, nowTh } from "@/lib/dashboard-format";
import { PageHeader, Panel, RankBadge, Thumb, rowCls, thCls } from "@/components/admin/dashboard-ui";

export const dynamic = "force-dynamic";

export default async function AdminRankingsPage() {
  await requireAdmin();
  const d = await getRankingsData();
  const maxBox = d.perActor[0]?.box || 1;

  return (
    <div className="space-y-8">
      <PageHeader
        title="อันดับ & ผลงาน"
        description="จัดอันดับภาพยนตร์และดาราในระบบ พร้อมตารางสรุปผลงานของดาราแต่ละคน"
        updatedAt={nowTh()}
      />

      <div className="grid gap-6 2xl:grid-cols-2">
        {/* Top 5 Box Office */}
        <Panel title="Top 5 ภาพยนตร์ทำเงินสูงสุด" icon={DollarSign} tone="text-emerald-500"
          href="/admin/movies" hrefLabel="จัดการภาพยนตร์" flush>
          {d.topMovies.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลภาพยนตร์</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className={thCls}>ภาพยนตร์</th>
                    <th className={thCls}>ดารา</th>
                    <th className={thCls}>ปี</th>
                    <th className={`${thCls} text-right`}>Box Office</th>
                    <th className="px-5 py-3 text-right font-medium">เรตติ้ง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.topMovies.map((m, i) => (
                    <tr key={m.id} className={rowCls}>
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

        {/* Top 5 Awarded */}
        <Panel title="Top 5 ดาราที่ได้รับรางวัลสูงสุด" icon={Trophy} tone="text-amber-400"
          href="/admin/actors" hrefLabel="จัดการดารา" flush>
          {d.topActors.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th className="px-5 py-3 font-medium">#</th>
                    <th className={thCls}>ดารา</th>
                    <th className={thCls}>สัญชาติ</th>
                    <th className={`${thCls} text-right`}>รางวัล</th>
                    <th className="px-5 py-3 text-right font-medium">หนังในระบบ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {d.topActors.map((a, i) => (
                    <tr key={a.id} className={rowCls}>
                      <td className="px-5 py-3"><RankBadge rank={i + 1} /></td>
                      <td className="px-2 py-3">
                        <div className="flex items-center gap-3">
                          <Thumb src={a.avatar_url} alt={a.name} className="h-10 w-10 shrink-0 rounded-full" />
                          <span className="font-medium">{a.name}</span>
                        </div>
                      </td>
                      <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{a.nationality ?? "-"}</td>
                      <td className="px-2 py-3 text-right font-semibold text-amber-500">{fmtNumber(a.awards_count)}</td>
                      <td className="px-5 py-3 text-right">{fmtNumber(a._count.movies)} เรื่อง</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      </div>

      {/* Top rated — โปสเตอร์ */}
      <Panel title="Top 5 ภาพยนตร์เรตติ้งสูงสุด" subtitle="เรียงตามคะแนน (เสมอกันดูที่ Box Office)" icon={Medal} tone="text-rose-500">
        {d.topRated.length === 0 ? (
          <p className="text-sm text-zinc-500">ยังไม่มีภาพยนตร์ที่มีคะแนนเรตติ้ง</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {d.topRated.map((m, i) => (
              <li key={m.id} className="group">
                <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 shadow-sm transition group-hover:-translate-y-1 group-hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-800">
                  <Thumb src={m.poster_url} alt={m.title} className="h-full w-full transition duration-300 group-hover:scale-105" />
                  <div className="absolute left-2 top-2"><RankBadge rank={i + 1} /></div>
                  <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-amber-300 backdrop-blur">
                    <Star size={12} className="fill-amber-300" /> {Number(m.rating).toFixed(1)}
                  </span>
                </div>
                <p className="mt-2 truncate text-sm font-medium">{m.title}</p>
                <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {m.actors.name} · {m.release_year ?? "-"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* ตารางผลงานดารา */}
      <Panel title="ตารางผลงานดาราโดยรวม" subtitle="เรียงตาม Box Office รวม (สูงสุด 10 คน)"
        icon={Users} tone="text-sky-500" href="/admin/actors" hrefLabel="จัดการดารา" flush>
        {d.perActor.length === 0 ? (
          <p className="p-5 text-sm text-zinc-500">ยังไม่มีข้อมูลดารา</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="px-5 py-3 font-medium">ดารา</th>
                  <th className={thCls}>สัญชาติ</th>
                  <th className={`${thCls} text-right`}>หนัง</th>
                  <th className={`${thCls} w-56`}>Box Office รวม</th>
                  <th className={`${thCls} text-right`}>เรตติ้งเฉลี่ย</th>
                  <th className="px-5 py-3 text-right font-medium">รางวัล</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {d.perActor.slice(0, 10).map((a) => (
                  <tr key={a.id} className={rowCls}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb src={a.avatar_url} alt={a.name} className="h-9 w-9 shrink-0 rounded-full" />
                        <span className="font-medium">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-zinc-600 dark:text-zinc-300">{a.nationality ?? "-"}</td>
                    <td className="px-2 py-3 text-right tabular-nums">{a.movieCount}</td>
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(a.box / maxBox) * 100}%` }} />
                        </div>
                        <span className="w-16 shrink-0 text-right text-xs tabular-nums">{fmtMoney(a.box)}</span>
                      </div>
                    </td>
                    <td className="px-2 py-3 text-right tabular-nums">
                      {a.avgRating !== null ? a.avgRating.toFixed(2) : "-"}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-amber-500">
                      {fmtNumber(a.awards)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
