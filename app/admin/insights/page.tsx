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
import { getInsightsData, leadName } from "@/lib/dashboard-data";
import { topWithOther } from "@/lib/dashboard-format";
import { getI18n } from "@/lib/i18n/server";
import type { Dict } from "@/lib/i18n/dictionaries";
import { BarRows, PageHeader, Panel, Thumb, rowCls } from "@/components/admin/dashboard-ui";

export const dynamic = "force-dynamic";

function ScoreRing({ score, q }: { score: number; q: Dict["admin"]["qa"] }) {
  const stroke =
    score >= 90 ? "stroke-emerald-500" : score >= 70 ? "stroke-amber-400" : "stroke-rose-500";
  return (
    <svg viewBox="0 0 42 42" role="img" aria-label={q.scoreAria(score)} className="h-40 w-40">
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
        {q.score}
      </text>
    </svg>
  );
}

function HealthRow({ label, count, href, q }: { label: string; count: number; href: string; q: Dict["admin"]["qa"] }) {
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
        <span className="shrink-0 text-xs text-emerald-500">{q.ok}</span>
      ) : (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-500 dark:text-amber-400"
        >
          {q.items(count)} <ExternalLink size={12} />
        </Link>
      )}
    </li>
  );
}

export default async function AdminInsightsPage() {
  await requireAdmin();
  const [d, { t }] = await Promise.all([getInsightsData(), getI18n()]);
  const h = d.health;
  const q = t.admin.qa;

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.admin.insights}
        description={q.description}
        updatedAt={t.date.dateTime(new Date())}
      />

      <Panel
        title={q.checkTitle}
        subtitle={d.issues === 0 ? q.allOk : q.issues(d.issues)}
        icon={ShieldCheck}
      >
        <div className="flex flex-col items-center gap-8 md:flex-row">
          <div className="shrink-0">
            <ScoreRing score={d.score} q={q} />
          </div>
          <ul className="w-full flex-1 divide-y divide-zinc-200 dark:divide-zinc-800">
            <HealthRow q={q} label={q.rows.noAvatar} count={h.noAvatar} href="/admin/actors" />
            <HealthRow q={q} label={q.rows.noBio} count={h.noBio} href="/admin/actors" />
            <HealthRow q={q} label={q.rows.noBirth} count={h.noBirth} href="/admin/actors" />
            <HealthRow q={q} label={q.rows.noMovies} count={h.noMovies} href="/admin/movies" />
            <HealthRow q={q} label={q.rows.noPoster} count={h.noPoster} href="/admin/movies" />
            <HealthRow q={q} label={q.rows.noRating} count={h.noRating} href="/admin/movies" />
            <HealthRow q={q} label={q.rows.noGenre} count={h.noGenre} href="/admin/movies" />
          </ul>
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={q.recentMovies} icon={Film}
          href="/admin/movies" hrefLabel={t.admin.manageMovies}>
          <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentMovies.map((m) => (
              <li key={m.id} className={`flex items-center gap-3 rounded-lg py-2.5 ${rowCls}`}>
                <Thumb src={m.poster_url} alt={m.title} className="h-12 w-8 shrink-0 rounded" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{m.title}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {leadName(m)} · {m.release_year ?? "-"}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{t.date.medium(m.created_at)}</span>
              </li>
            ))}
            {d.recentMovies.length === 0 && <li className="py-4 text-sm text-zinc-500">{t.admin.noData}</li>}
          </ul>
        </Panel>

        <Panel title={q.recentActors} icon={Users}
          href="/admin/actors" hrefLabel={t.admin.manageActors}>
          <ul className="-my-2 divide-y divide-zinc-200 dark:divide-zinc-800">
            {d.recentActors.map((a) => (
              <li key={a.id} className={`flex items-center gap-3 rounded-lg py-2.5 ${rowCls}`}>
                <Thumb src={a.avatar_url} alt={a.name} className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {a.nationality ?? t.common.noNationality}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">{t.date.medium(a.created_at)}</span>
              </li>
            ))}
            {d.recentActors.length === 0 && <li className="py-4 text-sm text-zinc-500">{t.admin.noData}</li>}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={q.byGenre} subtitle={q.byGenreHint} icon={Tags}>
          <BarRows rows={topWithOther(d.genres.map((g) => ({ ...g, label: t.common.genre(g.label) })), 8, q.other)} format={(n) => t.common.films(n)} />
        </Panel>
        <Panel title={q.byNationality} subtitle={q.byNationalityHint} icon={Globe2}>
          <BarRows rows={topWithOther(d.nationalities.map((n) => (n.label ? n : { ...n, label: q.unknownNationality })), 6, q.other)} format={(n) => t.common.people(n)} />
        </Panel>
      </div>
    </div>
  );
}
