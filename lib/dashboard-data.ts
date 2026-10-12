import "server-only";
import { prisma } from "@/lib/prisma";
import { splitGenres, tally } from "@/lib/dashboard-format";
import type { ChartActor, ChartMovie } from "@/components/admin/analytics-charts";

/** include นักแสดงนำ (ลำดับเครดิตแรก) — ใช้คู่กับ leadName() */
const leadInclude = {
  cast: {
    orderBy: { billing_order: "asc" },
    take: 1,
    select: { actor: { select: { id: true, name: true } } },
  },
} as const;

/** ชื่อนักแสดงนำของหนัง หรือ "-" ถ้ายังไม่มีนักแสดง */
export function leadName(movie: { cast: { actor: { name: string } }[] }): string {
  return movie.cast[0]?.actor.name ?? "-";
}

/** หนังที่ทราบรายได้เท่านั้น (null = ไม่ทราบ ไม่ใช่ 0) */
const hasBox = { box_office_mil: { not: null } } as const;

/* ======================================================================
 * หน้า "ภาพรวม" (/admin)
 * ==================================================================== */
/** คะแนนจากคนโหวตไม่กี่คนไม่น่าเชื่อถือ (เช่น 9.8 จาก 4 โหวต) — "เรตติ้งสูงสุด" นับเฉพาะเรื่องที่โหวตถึงเกณฑ์ */
export const MIN_VOTES = 500;

export async function getOverviewData() {
  const now = new Date();
  const [
    actorCount,
    movieCount,
    creditCount,
    boxAgg,
    awardsAgg,
    ratingAgg,
    yearAgg,
    topMovies,
    topActors,
    topRated,
    oldest,
    newest,
    mostProlific,
    genreRows,
    nationalityRows,
    health,
    creditsPerActor,
  ] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movie_cast.count(),
    prisma.movies.aggregate({ _sum: { box_office_mil: true }, _count: { box_office_mil: true } }),
    prisma.actors.aggregate({ _sum: { awards_count: true }, _count: { awards_count: true } }),
    prisma.movies.aggregate({ _avg: { rating: true }, _count: { rating: true } }),
    prisma.movies.aggregate({ where: { release_date: { lte: now } }, _min: { release_year: true }, _max: { release_year: true } }),
    prisma.movies.findMany({
      where: hasBox,
      orderBy: [{ box_office_mil: "desc" }, { id: "asc" }],
      take: 5,
      include: leadInclude,
    }),
    prisma.actors.findMany({
      where: { awards_count: { not: null } },
      orderBy: [{ awards_count: "desc" }, { id: "asc" }],
      take: 5,
      include: { _count: { select: { credits: true } } },
    }),
    prisma.movies.findFirst({
      where: { rating: { not: null }, vote_count: { gte: MIN_VOTES } },
      orderBy: [{ rating: "desc" }, { vote_count: "desc" }],
      include: leadInclude,
    }),
    prisma.movies.findFirst({
      where: { release_year: { not: null } },
      orderBy: [{ release_year: "asc" }, { id: "asc" }],
      include: leadInclude,
    }),
    // ใหม่ที่สุด = เข้าฉายแล้ว (ไม่นับหนังที่ประกาศล่วงหน้า)
    prisma.movies.findFirst({
      where: { release_date: { lte: now } },
      orderBy: [{ release_date: "desc" }, { id: "desc" }],
      include: leadInclude,
    }),
    prisma.actors.findFirst({
      orderBy: [{ credits: { _count: "desc" } }, { id: "asc" }],
      include: { _count: { select: { credits: true } } },
    }),
    prisma.movies.findMany({ select: { genre: true } }),
    prisma.actors.groupBy({ by: ["nationality"], _count: { _all: true } }),
    getHealthSummary(),
    prisma.movie_cast.groupBy({ by: ["actor_id"], _count: { _all: true } }),
  ]);

  // ดาราผลงานมากที่สุดอาจมีหลายคนเท่ากัน — นับคนที่เสมอด้วย จะได้ไม่สื่อว่ามีคนเดียว
  const maxCredits = mostProlific?._count.credits ?? 0;
  const prolificTies = creditsPerActor.filter((r) => r._count._all === maxCredits).length - 1;

  const totalBoxOffice = Number(boxAgg._sum.box_office_mil ?? 0);
  const totalAwards = awardsAgg._sum.awards_count ?? 0;
  const genres = tally(genreRows.flatMap((r) => splitGenres(r.genre)));
  const nationalities = nationalityRows
    .filter((r) => r.nationality)
    .sort((a, b) => b._count._all - a._count._all);

  return {
    actorCount,
    movieCount,
    creditCount,
    totalBoxOffice,
    boxKnown: boxAgg._count.box_office_mil,
    totalAwards,
    awardsKnown: awardsAgg._count.awards_count,
    avgRating: ratingAgg._avg.rating === null ? null : Number(ratingAgg._avg.rating),
    ratedCount: ratingAgg._count.rating,
    yearRange: { min: yearAgg._min.release_year, max: yearAgg._max.release_year },
    // เฉลี่ยจากเรื่องที่ทราบรายได้เท่านั้น
    avgBoxPerMovie: boxAgg._count.box_office_mil ? totalBoxOffice / boxAgg._count.box_office_mil : 0,
    // เฉลี่ยเฉพาะดาราที่มีข้อมูลรางวัล
    avgAwardsPerActor: awardsAgg._count.awards_count ? totalAwards / awardsAgg._count.awards_count : 0,
    // เครดิตต่อดารา (หนัง 1 เรื่องมีดาราได้หลายคน)
    avgMoviesPerActor: actorCount ? creditCount / actorCount : 0,
    genreCount: genres.length,
    topGenre: genres[0] ?? null,
    nationalityCount: nationalities.length,
    topNationality: nationalities[0] ? { label: nationalities[0].nationality!, value: nationalities[0]._count._all } : null,
    topMovies,
    topActors,
    topRated,
    oldest,
    newest,
    mostProlific,
    prolificTies: Math.max(0, prolificTies),
    health,
  };
}

/** จำนวนช่องข้อมูลที่ยังว่าง + คะแนนความครบถ้วน (ใช้ทั้งหน้าภาพรวมและหน้าคุณภาพข้อมูล) */
async function getHealthSummary() {
  const [actorCount, movieCount, noBio, noAvatar, noBirth, noMovies, noPoster, noRating, noGenre] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.actors.count({ where: { bio: null } }),
    prisma.actors.count({ where: { avatar_url: null } }),
    prisma.actors.count({ where: { birth_date: null } }),
    prisma.actors.count({ where: { credits: { none: {} } } }),
    prisma.movies.count({ where: { poster_url: null } }),
    prisma.movies.count({ where: { rating: null } }),
    prisma.movies.count({ where: { genre: null } }),
  ]);
  const health = { noAvatar, noBio, noBirth, noMovies, noPoster, noRating, noGenre };
  const issues = Object.values(health).reduce((s, n) => s + n, 0);
  // จำนวน "ช่องที่ควรมีข้อมูล" ทั้งหมด: ดารา 4 ช่อง (รูป/ประวัติ/วันเกิด/มีหนัง) + หนัง 3 ช่อง (โปสเตอร์/เรตติ้ง/ประเภท)
  const possible = actorCount * 4 + movieCount * 3;
  const score = possible ? Math.max(0, Math.round((1 - issues / possible) * 100)) : 100;
  return { health, issues, score };
}

/* ======================================================================
 * หน้า "วิเคราะห์เชิงกราฟ" (/admin/analytics)
 * ==================================================================== */
export async function getAnalyticsData() {
  const [movieRows, actorRows] = await Promise.all([
    prisma.movies.findMany({
      select: {
        id: true,
        title: true,
        cast: { select: { actor_id: true } },
        genre: true,
        release_year: true,
        box_office_mil: true,
        rating: true,
      },
    }),
    prisma.actors.findMany({
      orderBy: { id: "asc" },
      select: { id: true, name: true, nationality: true, awards_count: true },
    }),
  ]);

  const movies: ChartMovie[] = movieRows.map((m) => ({
    id: m.id,
    title: m.title,
    actorIds: m.cast.map((c) => c.actor_id),
    genres: splitGenres(m.genre),
    year: m.release_year,
    box: Number(m.box_office_mil ?? 0),
    rating: m.rating === null ? null : Number(m.rating),
  }));
  const actors: ChartActor[] = actorRows.map((a) => ({
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    awards: a.awards_count ?? 0, // กราฟ: ไม่มีข้อมูลนับเป็น 0 (แท่งที่เป็น 0 ถูกกรองออกอยู่แล้ว)
  }));

  return { movies, actors };
}

/* ======================================================================
 * หน้า "อันดับ & ผลงาน" (/admin/rankings)
 * ==================================================================== */
export async function getRankingsData() {
  const [topMovies, topActors, topRated, credits, actors] = await Promise.all([
    prisma.movies.findMany({
      where: hasBox,
      orderBy: [{ box_office_mil: "desc" }, { id: "asc" }],
      take: 5,
      include: leadInclude,
    }),
    prisma.actors.findMany({
      orderBy: [{ awards_count: "desc" }, { id: "asc" }],
      take: 5,
      include: { _count: { select: { credits: true } } },
    }),
    prisma.movies.findMany({
      where: { rating: { not: null } },
      orderBy: [{ rating: "desc" }, { box_office_mil: "desc" }],
      take: 5,
      include: leadInclude,
    }),
    prisma.movie_cast.findMany({
      select: { actor_id: true, movie: { select: { box_office_mil: true, rating: true } } },
    }),
    prisma.actors.findMany({
      select: { id: true, name: true, nationality: true, awards_count: true, avatar_url: true },
    }),
  ]);

  // รวมสถิติต่อดาราจากเครดิตนักแสดง (หนังหนึ่งเรื่องนับให้ดาราทุกคนในเรื่อง)
  const stats = new Map<number, { count: number; box: number; ratingSum: number; rated: number }>();
  for (const { actor_id, movie } of credits) {
    const s = stats.get(actor_id) ?? { count: 0, box: 0, ratingSum: 0, rated: 0 };
    s.count += 1;
    s.box += Number(movie.box_office_mil ?? 0);
    if (movie.rating !== null) {
      s.ratingSum += Number(movie.rating);
      s.rated += 1;
    }
    stats.set(actor_id, s);
  }
  const perActor = actors
    .map((a) => {
      const s = stats.get(a.id);
      return {
        id: a.id,
        name: a.name,
        nationality: a.nationality,
        avatar_url: a.avatar_url,
        awards: a.awards_count,
        movieCount: s?.count ?? 0,
        box: s?.box ?? 0,
        avgRating: s?.rated ? s.ratingSum / s.rated : null,
      };
    })
    .sort((a, b) => b.box - a.box || a.name.localeCompare(b.name));

  return { topMovies, topActors, topRated, perActor };
}

/* ======================================================================
 * หน้า "ข้อมูลล่าสุด & คุณภาพ" (/admin/insights)
 * ==================================================================== */
export async function getInsightsData() {
  const [actorCount, movieCount, recentMovies, recentActors, { health, issues, score }, genreRows, nationalityRows] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movies.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
      include: leadInclude,
    }),
    prisma.actors.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
      select: { id: true, name: true, nationality: true, avatar_url: true, created_at: true },
    }),
    getHealthSummary(),
    prisma.movies.findMany({ select: { genre: true } }),
    prisma.actors.groupBy({ by: ["nationality"], _count: { _all: true } }),
  ]);

  return {
    actorCount,
    movieCount,
    recentMovies,
    recentActors,
    health,
    issues,
    score,
    genres: tally(genreRows.flatMap((r) => splitGenres(r.genre))),
    nationalities: nationalityRows
      // label ว่าง = ไม่ระบุสัญชาติ (หน้าเว็บใส่ข้อความตามภาษาเอง)
      .map((r) => ({ label: r.nationality ?? "", value: r._count._all }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
  };
}
