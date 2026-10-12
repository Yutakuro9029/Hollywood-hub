import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import { ArrowLeft, Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { splitGenres, tally } from "@/lib/dashboard-format";
import { calcAge, formatNumber, formatRating, truncateText } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { tmdbImage } from "@/lib/tmdb-image";
import Navbar from "@/components/navbar";
import SiteFooter from "@/components/site-footer";
import FavoriteButton from "@/components/favorite-button";
import { Face, GoldBar, SectionHead, focusRing, goldLink } from "@/components/editorial";

/* ───────────────────────── Data ───────────────────────── */

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string | string[] }>;
};

const SORTS = ["year", "rating", "boxoffice"] as const;
type SortKey = (typeof SORTS)[number];

/** ใช้ cache() เพื่อให้ generateMetadata และ page แชร์ผลการ query เดียวกันในหนึ่ง request */
const getActor = cache((id: number) =>
  prisma.actors.findUnique({
    where: { id },
    include: {
      credits: { include: { movie: true } },
      awards: { orderBy: [{ year: { sort: "desc", nulls: "last" } }, { name_en: "asc" }] },
    },
  }),
);
type ActorWithCredits = NonNullable<Awaited<ReturnType<typeof getActor>>>;
type Credit = ActorWithCredits["credits"][number];
/** ภาพยนตร์ + บทบาทที่ดาราคนนี้เล่น */
type Movie = Credit["movie"] & { role_name: Credit["role_name"] };

/** ดาราที่ร่วมงานด้วยบ่อยที่สุด พร้อมชื่อหนังที่เล่นด้วยกัน */
async function getCoStars(actorId: number, movieIds: number[]) {
  if (movieIds.length === 0) return [];
  const rows = await prisma.movie_cast.findMany({
    where: { movie_id: { in: movieIds }, actor_id: { not: actorId } },
    select: {
      movie: { select: { id: true, title: true, popularity: true } },
      actor: { select: { id: true, name: true, nationality: true, avatar_url: true, awards_count: true } },
    },
  });
  const byActor = new Map<number, { actor: (typeof rows)[number]["actor"]; movies: (typeof rows)[number]["movie"][] }>();
  for (const { actor, movie } of rows) {
    const cur = byActor.get(actor.id) ?? { actor, movies: [] };
    cur.movies.push(movie);
    byActor.set(actor.id, cur);
  }
  return [...byActor.values()]
    .sort((a, b) => b.movies.length - a.movies.length || (b.actor.awards_count ?? -1) - (a.actor.awards_count ?? -1))
    .slice(0, 8)
    .map((c) => ({
      ...c,
      movies: c.movies.sort((x, y) => Number(y.popularity ?? 0) - Number(x.popularity ?? 0)),
    }));
}

function parseId(raw: string): number | null {
  if (!/^\d+$/.test(raw)) return null;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n > 0 && n <= 4_294_967_295 ? n : null;
}

function sortMovies(movies: Movie[], sort: SortKey): Movie[] {
  const byYear = (a: Movie, b: Movie) => (b.release_year ?? 0) - (a.release_year ?? 0);
  return [...movies].sort((a, b) => {
    if (sort === "rating") return Number(b.rating ?? -1) - Number(a.rating ?? -1) || byYear(a, b);
    if (sort === "boxoffice") return Number(b.box_office_mil ?? -1) - Number(a.box_office_mil ?? -1) || byYear(a, b);
    return byYear(a, b);
  });
}

/** รายได้หน่วยล้านดอลลาร์ → "$2.93B" / "$836.8M" */
function formatGross(mil: number): string {
  return mil >= 1000 ? `$${(mil / 1000).toFixed(2)}B` : `$${formatNumber(Math.round(mil * 10) / 10)}M`;
}


/* ───────────────────────── Metadata ───────────────────────── */

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { id } = await params;
  const actorId = parseId(id);
  const [actor, { t }] = await Promise.all([actorId ? getActor(actorId) : null, getI18n()]);
  if (!actor) return { title: `${t.actor.notFound} | Hollywood Hub` };

  const title = `${actor.name} | Hollywood Hub`;
  const description = actor.bio ? truncateText(actor.bio, 160) : t.actor.metaDesc(actor.name);
  return {
    title,
    description,
    openGraph: { title, description, images: actor.avatar_url ? [actor.avatar_url] : undefined },
  };
}

/* ───────────────────────── Page ───────────────────────── */

export default async function ActorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const [{ sort: sortParam }, { t, locale }] = await Promise.all([searchParams, getI18n()]);

  const actorId = parseId(id);
  if (!actorId) notFound();

  const actor = await getActor(actorId);
  if (!actor) notFound();

  const sortValue = Array.isArray(sortParam) ? sortParam[0] : sortParam;
  const sort: SortKey = SORTS.some((s) => s === sortValue) ? (sortValue as SortKey) : "year";
  const allMovies: Movie[] = actor.credits.map((c) => ({ ...c.movie, role_name: c.role_name }));
  const movies = sortMovies(allMovies, sort);

  const coStars = await getCoStars(actor.id, allMovies.map((m) => m.id));

  // สถิติรวมของผลงานทั้งหมด (รายได้รวมเฉพาะเรื่องที่ทราบรายได้)
  const totalBox = allMovies.reduce((sum, m) => sum + Number(m.box_office_mil ?? 0), 0);
  const knownBox = allMovies.filter((m) => m.box_office_mil !== null).length;
  const rated = allMovies.filter((m) => m.rating !== null);
  const avgRating = rated.length ? rated.reduce((sum, m) => sum + Number(m.rating), 0) / rated.length : null;
  const topGrossing = allMovies.reduce<Movie | null>(
    (best, m) => (m.box_office_mil !== null && (!best || Number(m.box_office_mil) > Number(best.box_office_mil)) ? m : best),
    null,
  );
  const genres = tally(allMovies.flatMap((m) => splitGenres(m.genre)));
  // ผลงานที่ได้รางวัล → ลิงก์ไปหน้าหนัง ถ้าเรื่องนั้นอยู่ในระบบ (เทียบชื่อเรื่อง)
  const movieByTitle = new Map(allMovies.map((m) => [m.title.toLowerCase(), m]));

  const age = calcAge(actor.birth_date);
  const bioParagraphs = (actor.bio ?? "").split(/\n\s*\n+/).map((p) => p.trim()).filter(Boolean);
  // ประวัติยาว: แสดง 2 ย่อหน้าแรก (หรือย่อหน้าแรกถ้ายาวมาก) ที่เหลือกดอ่านต่อ
  const leadCount = bioParagraphs.length > 1 && bioParagraphs[0].length < 500 ? 2 : 1;

  const facts = [
    { label: t.actor.factFilms, value: String(allMovies.length), unit: t.common.filmsUnit, hint: null as string | null, href: undefined as string | undefined },
    {
      label: t.actor.factGross,
      value: knownBox ? formatGross(totalBox) : "—",
      unit: "",
      hint: knownBox && knownBox < allMovies.length ? t.actor.grossHint(knownBox) : null,
      href: undefined,
    },
    { label: t.actor.factRating, value: avgRating === null ? "—" : avgRating.toFixed(1), unit: "/ 10", hint: rated.length ? t.actor.ratedHint(rated.length) : null, href: undefined },
    {
      label: t.actor.factTop,
      value: topGrossing?.title ?? "—",
      unit: "",
      hint: topGrossing ? formatGross(Number(topGrossing.box_office_mil)) : null,
      href: topGrossing ? `/movies/${topGrossing.id}` : undefined,
    },
  ];

  return (
    <>
      <Navbar />

      <main className="mx-auto max-w-[1400px] space-y-24 px-4 pb-8 pt-10 sm:space-y-28 sm:px-6 lg:px-10">
        {/* ═══════ ประวัติแบบบทความนิตยสาร ═══════ */}
        <section aria-labelledby="actor-name">
          <Link href="/actors" className={`inline-flex items-center gap-2 rounded-sm text-sm text-cream/70 transition-colors hover:text-gold-light ${focusRing}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {t.common.allActors}
          </Link>

          <article className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* กรอบทองเยื้องหลังภาพ (เหมือนดาราประจำสัปดาห์หน้าแรก) */}
                <span aria-hidden className="absolute -bottom-3 -right-3 left-3 top-3 border border-gold-dark" />
                <div className="relative aspect-[4/5] overflow-hidden bg-surface">
                  {actor.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={tmdbImage(actor.avatar_url, "w500") ?? undefined}
                      alt={t.common.photoOf(actor.name)}
                      className="h-full w-full object-cover object-top"
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center font-editorial text-7xl text-gold-light">{actor.name.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="min-w-0 lg:col-span-7 lg:pt-2">
              <h1 id="actor-name" className="font-editorial text-5xl italic leading-[1.05] text-cream sm:text-7xl">
                {actor.name}
              </h1>

              <dl className="mt-7 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-5 border-y border-line py-5 sm:grid-cols-3">
                <div>
                  <dt className="text-xs text-muted">{t.actor.nationality}</dt>
                  <dd className="mt-1 text-cream">
                    {actor.nationality ? (
                      <Link href={`/actors?nationality=${encodeURIComponent(actor.nationality)}`} className={goldLink}>
                        {actor.nationality}
                      </Link>
                    ) : (
                      t.common.notSpecified
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t.actor.born}</dt>
                  <dd className="mt-1 text-cream">
                    {actor.birth_date ? t.date.long(actor.birth_date) : t.common.notSpecified}
                    {age !== null && <span className="block text-sm text-muted">{t.common.age(age)}</span>}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted">{t.actor.awards}</dt>
                  <dd className="mt-1 font-editorial text-2xl text-gold-light">
                    {actor.awards.length > 0 ? (
                      <a href="#awards" className={`rounded-sm underline decoration-gold-dark underline-offset-[6px] hover:decoration-gold ${focusRing}`}>
                        {t.common.awards(actor.awards_count)}
                      </a>
                    ) : (
                      t.common.awards(actor.awards_count)
                    )}
                  </dd>
                </div>
              </dl>

              {/* ประวัติ */}
              {bioParagraphs.length === 0 ? (
                <p className="mt-7 text-muted">{t.actor.noBio}</p>
              ) : (
                <div lang="en" className="mt-7 max-w-[64ch] space-y-5 font-editorial text-lg leading-[1.8] text-cream/85">
                  {bioParagraphs.slice(0, leadCount).map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                  {bioParagraphs.length > leadCount && (
                    <details className="group">
                      <summary className={`inline-block cursor-pointer list-none font-sans text-sm ${goldLink}`}>
                        <span className="group-open:hidden">{t.actor.readMoreBio}</span>
                        <span className="hidden group-open:inline">{t.actor.lessBio}</span>
                      </summary>
                      <div className="mt-5 space-y-5">
                        {bioParagraphs.slice(leadCount).map((p, i) => (
                          <p key={i}>{p}</p>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              )}

              <div className="mt-9">
                <FavoriteButton
                  kind="actor"
                  variant="pill"
                  className="h-12"
                  item={{ id: actor.id, name: actor.name, avatar_url: actor.avatar_url, nationality: actor.nationality }}
                />
              </div>
            </div>
          </article>
        </section>

        {/* ═══════ สถิติผลงาน ═══════ */}
        <section aria-labelledby="stats-title">
          <SectionHead id="stats-title" title={t.actor.statsTitle} description={t.actor.statsDesc} />
          <dl className="mt-8 grid grid-cols-2 gap-y-8 md:grid-cols-4">
            {facts.map((f, i) => (
              <div key={f.label} className={`min-w-0 pr-4 ${i > 0 ? "md:border-l md:border-line md:pl-6" : ""} ${i % 2 === 1 ? "border-l border-line pl-4 md:pl-6" : ""}`}>
                <dt className="text-xs text-muted">{f.label}</dt>
                <dd
                  className={`mt-2 font-editorial text-cream ${
                    // ชื่อหนังยาวกว่าตัวเลข: ตัวเล็กลงและขึ้นได้ 2 บรรทัด แทนการตัดทิ้ง
                    f.href ? "line-clamp-2 text-xl leading-snug sm:text-2xl" : "truncate text-3xl sm:text-4xl"
                  }`}
                >
                  {f.href ? (
                    <Link href={f.href} className={`rounded-sm hover:text-gold-light ${focusRing}`}>
                      {f.value}
                    </Link>
                  ) : (
                    f.value
                  )}
                  {f.unit && <span className="ml-2 font-sans text-sm text-muted">{f.unit}</span>}
                </dd>
                {f.hint && <dd className="mt-1 truncate text-xs text-gold-light">{f.hint}</dd>}
              </div>
            ))}
          </dl>
        </section>

        {/* ═══════ รางวัลและเกียรติยศ (Wikidata) ═══════ */}
        {actor.awards.length > 0 && (
          <section id="awards" aria-labelledby="awards-title" className="scroll-mt-24">
            <SectionHead id="awards-title" title={t.actor.awardsTitle} description={t.actor.awardsDesc(actor.awards.length)} />
            <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-14 lg:grid-cols-2">
              {actor.awards.map((a) => {
                // ชื่อภาษาไทยมีเฉพาะบางรางวัล (จาก Wikidata) ไม่มีจึงใช้ภาษาอังกฤษ
                const name = locale === "th" && a.name_th ? a.name_th : a.name_en;
                const work = a.for_work ? movieByTitle.get(a.for_work.toLowerCase()) : undefined;
                return (
                  <li key={a.id} className="grid grid-cols-[3.5rem_minmax(0,1fr)_auto] items-start gap-x-4 border-b border-line py-4">
                    <span className="font-editorial text-lg text-gold-light tabular-nums">{a.year ?? "—"}</span>
                    <span className="min-w-0">
                      <span className="block text-cream">{name.charAt(0).toUpperCase() + name.slice(1)}</span>
                      {a.for_work && (
                        <span className="mt-0.5 block truncate text-sm text-muted">
                          {work ? (
                            <Link href={`/movies/${work.id}`} className={`rounded-sm hover:text-gold-light ${focusRing}`}>
                              {t.actor.forWork(a.for_work)}
                            </Link>
                          ) : (
                            t.actor.forWork(a.for_work)
                          )}
                        </span>
                      )}
                    </span>
                    <Trophy className="mt-1 h-4 w-4 text-gold-dark" aria-hidden />
                  </li>
                );
              })}
            </ul>
            <p className="mt-4 text-xs text-muted">{t.actor.awardsSource}</p>
          </section>
        )}

        {/* ═══════ ผลงานภาพยนตร์ (ตารางเครดิต) ═══════ */}
        <section id="filmography" aria-labelledby="filmography-title" className="scroll-mt-24">
          <SectionHead
            id="filmography-title"
            title={t.actor.filmography}
            description={t.common.moviesInSystem(allMovies.length)}
            action={
              allMovies.length > 1 && (
                <nav aria-label={t.actor.sortFilmography} className="flex gap-x-5">
                  <span>{t.common.sortBy}</span>
                  {SORTS.map((key) => (
                    <Link
                      key={key}
                      href={key === "year" ? `/actors/${actor.id}#filmography` : `/actors/${actor.id}?sort=${key}#filmography`}
                      scroll={false}
                      aria-current={key === sort ? "true" : undefined}
                      className={`rounded-sm transition-colors ${focusRing} ${
                        key === sort ? "text-gold-light underline decoration-gold underline-offset-[6px]" : "text-cream/70 hover:text-cream"
                      }`}
                    >
                      {t.actor.sorts[key]}
                    </Link>
                  ))}
                </nav>
              )
            }
          />

          {movies.length === 0 ? (
            <p className="mt-8 text-muted">{t.actor.noFilms(actor.name)}</p>
          ) : (
            <ul className="mt-6">
              {movies.map((m) => (
                <li key={m.id} className="border-b border-line">
                  <Link
                    href={`/movies/${m.id}`}
                    className={`group grid grid-cols-[3rem_2.75rem_minmax(0,1fr)] items-center gap-x-4 py-4 transition-colors hover:bg-surface sm:grid-cols-[3.5rem_3rem_minmax(0,1fr)_7rem_4rem] ${focusRing}`}
                  >
                    <span className="font-editorial text-lg text-gold-light tabular-nums">{m.release_year ?? "—"}</span>
                    <span className="block aspect-[2/3] w-full overflow-hidden bg-surface">
                      {m.poster_url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={tmdbImage(m.poster_url, "w92") ?? undefined} alt="" loading="lazy" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-lg text-cream transition-colors group-hover:text-gold-light">{m.title}</span>
                      <span className="block truncate text-sm text-muted">
                        {m.role_name ? t.common.asRole(m.role_name) : t.common.noRole}
                        {m.genre && <span className="sm:hidden">, {m.genre.split(",").map((g) => t.common.genre(g.trim())).join(", ")}</span>}
                      </span>
                      {/* มือถือ: รายได้/คะแนนต่อท้ายบรรทัด */}
                      <span className="mt-1 flex gap-4 text-xs sm:hidden">
                        {m.box_office_mil !== null && <span className="text-gold-light">{formatGross(Number(m.box_office_mil))}</span>}
                        {m.rating !== null && <span className="text-cream/70">{formatRating(m.rating)} / 10</span>}
                      </span>
                    </span>
                    <span className="hidden text-right text-sm text-gold-light tabular-nums sm:block">
                      {m.box_office_mil === null ? <span className="text-muted">—</span> : formatGross(Number(m.box_office_mil))}
                    </span>
                    <span className="hidden text-right text-sm text-cream/80 tabular-nums sm:block" title={t.common.outOf10}>
                      {formatRating(m.rating)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ═══════ แนวที่เล่นบ่อย (แถบทองตามสัดส่วน) ═══════ */}
        {genres.length > 0 && (
          <section aria-labelledby="genres-title">
            <SectionHead id="genres-title" title={t.actor.genresTitle} description={t.actor.genresDesc} />
            <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-14 sm:grid-cols-2">
              {genres.map((g) => (
                <li key={g.label} className="border-b border-line">
                  <Link href={`/movies?genre=${encodeURIComponent(g.label)}`} className={`group block py-4 ${focusRing}`}>
                    <span className="flex items-baseline justify-between gap-4">
                      <span className="text-cream transition-colors group-hover:text-gold-light">{t.common.genre(g.label)}</span>
                      <span className="text-sm text-muted">
                        <span className="font-editorial text-xl text-cream tabular-nums">{g.value}</span>{t.actor.ofFilms(allMovies.length)}
                      </span>
                    </span>
                    <GoldBar share={g.value / Math.max(1, allMovies.length)} />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ═══════ ร่วมงานบ่อยกับ ═══════ */}
        {coStars.length > 0 && (
          <section aria-labelledby="costars-title">
            <SectionHead id="costars-title" title={t.actor.costarsTitle} description={t.actor.costarsDesc} />
            <ul className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-x-14 lg:grid-cols-2">
              {coStars.map(({ actor: co, movies: shared }) => (
                <li key={co.id} className="flex items-center gap-5 border-b border-line py-5">
                  <Link href={`/actors/${co.id}`} tabIndex={-1} aria-hidden className="shrink-0">
                    <Face name={co.name} url={co.avatar_url} className="h-14 w-14" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <Link href={`/actors/${co.id}`} className={`rounded-sm text-lg text-cream hover:text-gold-light ${focusRing}`}>
                      {co.name}
                    </Link>
                    <p className="mt-1 truncate text-sm text-muted">
                      {shared.slice(0, 3).map((m, i) => (
                        <span key={m.id}>
                          {i > 0 && ", "}
                          <Link href={`/movies/${m.id}`} className={`rounded-sm hover:text-cream ${focusRing}`}>
                            {m.title}
                          </Link>
                        </span>
                      ))}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block font-editorial text-3xl leading-none text-gold-light tabular-nums">{shared.length}</span>
                    <span className="text-xs text-muted">{t.common.filmsUnit}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
