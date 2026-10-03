import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Film,
  Globe2,
  ShieldCheck,
  Tags,
  Users,
} from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { getInsightsData } from "@/lib/dashboard-data";
import { fmtDate, nowTh } from "@/lib/format";
import { BarRows, PageHeader, Panel, Thumb, rowCls } from "@/components/admin/dashboard-ui";

export const dynamic = "force-dynamic";

function ScoreRing({ score }: { score: number }) {
  const stroke =
    score >= 90 ? "stroke-emerald-500" : score >= 70 ? "stroke-amber-400" : "stroke-rose-500";
  return (
    <svg viewBox="0 0 42 42" role="img" aria-label={`คะแนนความครบถ้วน ${score}%`} className="h-40 w-40">
      <circle cx={21} cy={21} r={15.9155} fill="none" strokeWidth={4} className="stroke-zinc-100 dark:stroke-zinc-800" />
      <circle
        cx={21} cy={21} r={15.9155} fill="none" strokeWidth={4} strokeLinecap="round"
        className={stroke}
        strokeDasharray={`${score} ${100 - score}`}
        strokeDashoffset={25}
      />
      <text x={21} y={22.5} textAnchor="middle" fontSize={9} fontWeight={700} className="fill-zinc-900 dark:fill-zinc-100">
        {score}%
      </text>
      <text x={21} y={28} textAnchor="middle" fontSize={3} className="fill-zinc-500 dark:fill-zinc-400">
        ความครบถ้วน
      </text>
    </svg>
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
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          {count} รายการ <ExternalLink size={12} />
        </Link>
      )}
    </li>
  );
}

export default async function AdminInsightsPage() {
  await requireAdmin();
  const d = await getInsightsData();
  const h = d.health;

  return (
    <div className="space-y-8">
      <PageHeader
        title="ข้อมูลล่าสุด & คุณภาพ"
        description="ติดตามรายการที่เพิ่มล่าสุด ตรวจความครบถ้วนของข้อมูล และดูสัดส่วนประเภทภาพยนตร์/สัญชาติของดารา"
        updatedAt={nowTh()}
      />

      <Panel
        title="ตรวจสอบความครบถ้วนของข้อมูล"
        subtitle={d.issues === 0 ? "ข้อมูลครบถ้วนทุกรายการ" : `พบ ${d.issues} รายการที่ควรเติมข้อมูล`}
        icon={ShieldCheck}
        tone={d.issues === 0 ? "text-emerald-500" : "text-amber-500"}
      >
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="shrink-0">
            <ScoreRing score={d.score} />
          </div>
          <ul className="w-full flex-1 divide-y divide-zinc-200 dark:divide-zinc-800">
            <HealthRow label="ดาราที่ยังไม่มีรูปโปรไฟล์" count={h.noAvatar} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่มีประวัติ (bio)" count={h.noBio} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่ระบุวันเกิด" count={h.noBirth} href="/admin/actors" />
            <HealthRow label="ดาราที่ยังไม่มีหนังในระบบ" count={h.noMovies} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่มีโปสเตอร์" count={h.noPoster} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่มีคะแนนเรตติ้ง" count={h.noRating} href="/admin/movies" />
            <HealthRow label="หนังที่ยังไม่ระบุประเภท" count={h.noGenre} href="/admin/movies" />
          </ul>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="ภาพยนตร์ที่เพิ่มล่าสุด" icon={Film} tone="text-violet-500"
          href="/admin/movies" hrefLabel="จัดการภาพยนตร์">
          <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentMovies.map((m) => (
              <li key={m.id} className={`flex items-center gap-3 rounded-lg py-2.5 ${rowCls}`}>
                <Thumb src={m.poster_url} alt={m.title} className="h-12 w-8 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {m.actors.name} · {m.release_year ?? "-"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{fmtDate(m.created_at)}</span>
              </li>
            ))}
            {d.recentMovies.length === 0 && <li className="py-4 text-sm text-zinc-500">ยังไม่มีข้อมูล</li>}
          </ul>
        </Panel>

        <Panel title="ดาราที่เพิ่มล่าสุด" icon={Users} tone="text-sky-500"
          href="/admin/actors" hrefLabel="จัดการดารา">
          <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentActors.map((a) => (
              <li key={a.id} className={`flex items-center gap-3 rounded-lg py-2.5 ${rowCls}`}>
                <Thumb src={a.avatar_url} alt={a.name} className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {a.nationality ?? "ไม่ระบุสัญชาติ"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{fmtDate(a.created_at)}</span>
              </li>
            ))}
            {d.recentActors.length === 0 && <li className="py-4 text-sm text-zinc-500">ยังไม่มีข้อมูล</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="จำนวนหนังแยกตามประเภท" subtitle="หนัง 1 เรื่องนับได้หลายประเภท" icon={Tags} tone="text-violet-500">
          <BarRows rows={d.genres} format={(n) => `${n} เรื่อง`} barClass="bg-violet-500" />
        </Panel>
        <Panel title="ดาราแยกตามสัญชาติ" icon={Globe2} tone="text-sky-500">
          <BarRows rows={d.nationalities} format={(n) => `${n} คน`} barClass="bg-sky-500" />
        </Panel>
      </div>
    </div>
  );
}
