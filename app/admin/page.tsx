import Link from "next/link";
import { ExternalLink, ShieldCheck, Sparkles, Trophy, Wallet } from "lucide-react";
import { requireAdmin } from "@/lib/dal";
import { MIN_VOTES, getOverviewData, leadName } from "@/lib/dashboard-data";
import { fmtMoney, fmtNumber } from "@/lib/dashboard-format";
import { getI18n } from "@/lib/i18n/server";
import { PageHeader, Panel, RankBadge, Thumb, quickBtn, rowCls } from "@/components/admin/dashboard-ui";
import { GoldBar } from "@/components/editorial";

export const dynamic = "force-dynamic";

/** ช่องข้อมูลที่ตรวจความครบถ้วน (คีย์ตรงกับ getHealthSummary / t.admin.ov.healthLabels) */
const HEALTH_KEYS = ["noAvatar", "noBio", "noBirth", "noMovies", "noPoster", "noRating", "noGenre"] as const;

/** ช่องตัวเลขหลัก: ค่าใหญ่ + บรรทัดอธิบายที่มาของตัวเลข */
function Stat({ label, value, unit, notes, className = "" }: { label: string; value: string; unit?: string; notes: string[]; className?: string }) {
  return (
    <div className={`bg-surface px-5 py-5 ${className}`}>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-1">
        <span className="font-editorial text-4xl text-cream tabular-nums">{value}</span>
        {unit && <span className="ml-1.5 text-sm text-muted">{unit}</span>}
      </dd>
      {notes.map((n) => (
        <dd key={n} className="mt-1 text-xs leading-relaxed text-cream/60">
          {n}
        </dd>
      ))}
    </div>
  );
}

export default async function AdminOverviewPage() {
  // layout ไม่ re-render ทุกครั้งที่เปลี่ยนหน้า จึงต้องเช็กสิทธิ์ซ้ำในหน้านี้ด้วย
  await requireAdmin();
  const [d, { t }] = await Promise.all([getOverviewData(), getI18n()]);
  const o = t.admin.ov;

  const maxAwards = d.topActors[0]?.awards_count ?? 1;
  const maxBox = Number(d.topMovies[0]?.box_office_mil ?? 1);
  const missing = HEALTH_KEYS
    .map((k) => ({ key: k, label: o.healthLabels[k], count: d.health.health[k] }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const facts = [
    {
      label: o.mostProlific,
      title: d.mostProlific?.name,
      sub: d.mostProlific
        ? `${t.common.moviesInSystem(d.mostProlific._count.credits)}${d.prolificTies > 0 ? o.tiedWith(d.prolificTies) : ""}`
        : null,
      img: d.mostProlific?.avatar_url ?? null,
      round: true,
    },
    {
      label: o.topRated(fmtNumber(MIN_VOTES)),
      title: d.topRated?.title,
      sub: d.topRated ? `${o.votes(Number(d.topRated.rating).toFixed(1), fmtNumber(d.topRated.vote_count ?? 0))} · ${leadName(d.topRated)}` : null,
      img: d.topRated?.poster_url ?? null,
    },
    {
      label: o.newest,
      title: d.newest?.title,
      sub: d.newest ? `${d.newest.release_date ? t.date.medium(d.newest.release_date) : d.newest.release_year} · ${leadName(d.newest)}` : null,
      img: d.newest?.poster_url ?? null,
    },
    {
      label: o.oldest,
      title: d.oldest?.title,
      sub: d.oldest?.release_year ? `${o.yearOf(d.oldest.release_year)} · ${leadName(d.oldest)}` : null,
      img: d.oldest?.poster_url ?? null,
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={t.admin.overview}
        description={o.description}
        updatedAt={t.date.dateTime(new Date())}
        actions={
          <Link href="/" className={quickBtn}>
            <ExternalLink size={15} aria-hidden /> {t.admin.viewSite}
          </Link>
        }
      />

      {/* ═══════ ตัวเลขหลัก: แถบเดียว แบ่งด้วยเส้นบาง ═══════ */}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[4px] border border-line bg-line lg:grid-cols-5">
        <Stat
          className="col-span-2 lg:col-span-1"
          label={o.actors}
          value={fmtNumber(d.actorCount)}
          unit={t.common.peopleUnit}
          notes={[
            `${o.nationalities(d.nationalityCount)}${d.topNationality ? o.mostFrom(d.topNationality.label, d.topNationality.value) : ""}`,
            o.perActor(fmtNumber(d.avgMoviesPerActor, 1)),
          ]}
        />
        <Stat
          label={o.movies}
          value={fmtNumber(d.movieCount)}
          unit={t.common.filmsUnit}
          notes={[
            `${o.genresCount(d.genreCount)}${d.topGenre ? o.topGenre(t.common.genre(d.topGenre.label)) : ""}`,
            d.yearRange.min && d.yearRange.max ? o.yearRange(d.yearRange.min, d.yearRange.max) : o.noYears,
          ]}
        />
        <Stat
          label={o.avgRating}
          value={d.avgRating !== null ? d.avgRating.toFixed(2) : "–"}
          unit="/ 10"
          notes={[o.ratedFrom(fmtNumber(d.ratedCount))]}
        />
        <Stat
          label={o.totalAwards}
          value={fmtNumber(d.totalAwards)}
          unit={t.common.awardsUnit}
          notes={[o.awardsFrom(d.awardsKnown), o.awardsAvg(fmtNumber(d.avgAwardsPerActor, 1))]}
        />
        <Stat
          label={o.boxOffice}
          value={fmtMoney(d.totalBoxOffice)}
          notes={[o.boxKnown(d.boxKnown, d.movieCount), o.boxAvg(fmtMoney(d.avgBoxPerMovie))]}
        />
      </dl>

      {/* ═══════ อันดับ: ดารานำ (ซ้าย) / หนัง (ขวา) ═══════ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={o.topAwarded} icon={Trophy} href="/admin/rankings" hrefLabel={t.admin.allRankings} flush>
          {d.topActors.length === 0 ? (
            <p className="p-5 text-sm text-muted">{o.noAwards}</p>
          ) : (
            <ol className="divide-y divide-line">
              {d.topActors.map((a, i) => (
                <li key={a.id} className={`flex items-center gap-4 px-5 py-3 ${rowCls}`}>
                  <RankBadge rank={i + 1} />
                  <Thumb src={a.avatar_url} alt="" className="h-10 w-10 shrink-0 rounded-full ring-1 ring-gold-dark" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/actors/${a.id}`} className="truncate text-cream hover:text-gold-light">
                        {a.name}
                      </Link>
                      <span className="shrink-0 text-sm text-gold-light tabular-nums">{t.common.awards(a.awards_count)}</span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {a.nationality ?? t.common.noNationality} · {t.common.films(a._count.credits)}
                    </p>
                    <GoldBar share={(a.awards_count ?? 0) / maxAwards} className="mt-1.5" />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel title={o.topGrossing} icon={Wallet} href="/admin/rankings" hrefLabel={t.admin.allRankings} flush>
          {d.topMovies.length === 0 ? (
            <p className="p-5 text-sm text-muted">{o.noBox}</p>
          ) : (
            <ol className="divide-y divide-line">
              {d.topMovies.map((m, i) => (
                <li key={m.id} className={`flex items-center gap-4 px-5 py-3 ${rowCls}`}>
                  <RankBadge rank={i + 1} />
                  <Thumb src={m.poster_url} alt="" className="h-12 w-8 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/movies/${m.id}`} className="truncate text-cream hover:text-gold-light">
                        {m.title}
                      </Link>
                      <span className="shrink-0 text-sm text-gold-light tabular-nums">{fmtMoney(Number(m.box_office_mil))}</span>
                    </div>
                    <p className="truncate text-xs text-muted">
                      {leadName(m)} · {m.release_year ?? "–"}
                    </p>
                    <GoldBar share={Number(m.box_office_mil) / maxBox} className="mt-1.5" />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>

      {/* ═══════ ข้อมูลเด่น + ความครบถ้วน ═══════ */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Panel title={o.facts} icon={Sparkles} flush>
          <dl className="grid divide-y divide-line sm:grid-cols-2 sm:divide-y-0">
            {facts.map((f, i) => (
              <div
                key={f.label}
                className={`flex items-center gap-4 px-5 py-4 ${i >= 2 ? "sm:border-t sm:border-line" : ""} ${i % 2 === 1 ? "sm:border-l sm:border-line" : ""}`}
              >
                <Thumb src={f.img} alt="" className={f.round ? "h-12 w-12 shrink-0 rounded-full ring-1 ring-gold-dark" : "h-14 w-10 shrink-0"} />
                <div className="min-w-0">
                  <dt className="text-xs text-muted">{f.label}</dt>
                  <dd className="truncate text-cream">{f.title ?? "–"}</dd>
                  {f.sub && <dd className="truncate text-xs text-cream/60">{f.sub}</dd>}
                </div>
              </div>
            ))}
          </dl>
        </Panel>

        <Panel title={o.health} icon={ShieldCheck} href="/admin/insights" hrefLabel={t.admin.checkDetails}>
          <div className="flex items-baseline gap-3">
            <span className="font-editorial text-5xl text-cream tabular-nums">{d.health.score}%</span>
            <span className="text-sm text-muted">
              {d.health.issues === 0 ? o.allFilled : o.emptyFields(fmtNumber(d.health.issues))}
            </span>
          </div>
          <GoldBar share={d.health.score / 100} className="mt-3" />
          {missing.length > 0 ? (
            <ul className="mt-5 divide-y divide-line border-y border-line text-sm">
              {missing.map((m) => (
                <li key={m.key} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-cream/80">{m.label}</span>
                  <span className="tabular-nums text-muted">{m.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-5 text-sm text-cream/70">{o.healthOk}</p>
          )}
        </Panel>
      </div>
    </div>
  );
}
