import "server-only";
import { prisma } from "@/lib/prisma";
import { splitGenres, tally } from "@/lib/format";
import type { ChartActor, ChartMovie } from "@/components/admin/dashboard-charts";

/* ======================================================================
 * หน้า "ภาพรวม" (/admin)
 * ==================================================================== */
export async function getOverviewData() {
  const [
    actorCount,
    movieCount,
    boxAgg,
    awardsAgg,
    ratingAgg,
    top3Movies,
    top3Actors,
    topRated,
    oldest,
    newest,
    mostProlific,
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
      take: 3,
      include: { actors: { select: { name: true } } },
    }),
    prisma.actors.findMany({
      orderBy: [{ awards_count: "desc" }, { id: "asc" }],
      take: 3,
      include: { _count: { select: { movies: true } } },
    }),
    prisma.movies.findFirst({
      where: { rating: { not: null } },
      orderBy: [{ rating: "desc" }, { box_office_mil: "desc" }],
    }),
    prisma.movies.findFirst({
      where: { release_year: { not: null } },
      orderBy: { release_year: "asc" },
    }),
    prisma.movies.findFirst({
      where: { release_year: { not: null } },
      orderBy: { release_year: "desc" },
    }),
    prisma.actors.findFirst({
      orderBy: [{ movies: { _count: "desc" } }, { id: "asc" }],
      include: { _count: { select: { movies: true } } },
    }),
    prisma.movies.findMany({ select: { genre: true } }),
    prisma.actors.groupBy({ by: ["nationality"], _count: { _all: true } }),
  ]);

  const totalBoxOffice = Number(boxAgg._sum.box_office_mil ?? 0);
  const totalAwards = awardsAgg._sum.awards_count ?? 0;

  return {
    actorCount,
    movieCount,
    totalBoxOffice,
    totalAwards,
    avgRating: ratingAgg._avg.rating === null ? null : Number(ratingAgg._avg.rating),
    avgBoxPerMovie: movieCount ? totalBoxOffice / movieCount : 0,
    avgAwardsPerActor: actorCount ? totalAwards / actorCount : 0,
    avgMoviesPerActor: actorCount ? movieCount / actorCount : 0,
    genreCount: new Set(genreRows.flatMap((r) => splitGenres(r.genre))).size,
    nationalityCount: nationalityRows.length,
    top3Movies,
    top3Actors,
    topRated,
    oldest,
    newest,
    mostProlific,
  };
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
        actor_id: true,
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
    actorId: m.actor_id,
    genres: splitGenres(m.genre),
    year: m.release_year,
    box: Number(m.box_office_mil),
    rating: m.rating === null ? null : Number(m.rating),
  }));
  const actors: ChartActor[] = actorRows.map((a) => ({
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    awards: a.awards_count,
  }));

  return { movies, actors };
}

/* ======================================================================
 * หน้า "อันดับ & ผลงาน" (/admin/rankings)
 * ==================================================================== */
export async function getRankingsData() {
  const [topMovies, topActors, topRated, grouped, actors] = await Promise.all([
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
    prisma.movies.findMany({
      where: { rating: { not: null } },
      orderBy: [{ rating: "desc" }, { box_office_mil: "desc" }],
      take: 5,
      include: { actors: { select: { name: true } } },
    }),
    prisma.movies.groupBy({
      by: ["actor_id"],
      _sum: { box_office_mil: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.actors.findMany({
      select: { id: true, name: true, nationality: true, awards_count: true, avatar_url: true },
    }),
  ]);

  const stats = new Map<number, (typeof grouped)[number]>(
    grouped.map((g) => [g.actor_id, g] as [number, (typeof grouped)[number]]),
  );
  const perActor = actors
    .map((a) => {
      const g = stats.get(a.id);
      return {
        id: a.id,
        name: a.name,
        nationality: a.nationality,
        avatar_url: a.avatar_url,
        awards: a.awards_count,
        movieCount: g?._count._all ?? 0,
        box: Number(g?._sum.box_office_mil ?? 0),
        avgRating: g?._avg.rating == null ? null : Number(g._avg.rating),
      };
    })
    .sort((a, b) => b.box - a.box || a.name.localeCompare(b.name));

  return { topMovies, topActors, topRated, perActor };
}

/* ======================================================================
 * หน้า "ข้อมูลล่าสุด & คุณภาพ" (/admin/insights)
 * ==================================================================== */
export async function getInsightsData() {
  const [
    actorCount,
    movieCount,
    recentMovies,
    recentActors,
    noBio,
    noAvatar,
    noBirth,
    noMovies,
    noPoster,
    noRating,
    noGenre,
    genreRows,
    nationalityRows,
  ] = await Promise.all([
    prisma.actors.count(),
    prisma.movies.count(),
    prisma.movies.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
      include: { actors: { select: { name: true } } },
    }),
    prisma.actors.findMany({
      orderBy: [{ created_at: "desc" }, { id: "desc" }],
      take: 6,
      select: { id: true, name: true, nationality: true, avatar_url: true, created_at: true },
    }),
    prisma.actors.count({ where: { bio: null } }),
    prisma.actors.count({ where: { avatar_url: null } }),
    prisma.actors.count({ where: { birth_date: null } }),
    prisma.actors.count({ where: { movies: { none: {} } } }),
    prisma.movies.count({ where: { poster_url: null } }),
    prisma.movies.count({ where: { rating: null } }),
    prisma.movies.count({ where: { genre: null } }),
    prisma.movies.findMany({ select: { genre: true } }),
    prisma.actors.groupBy({ by: ["nationality"], _count: { _all: true } }),
  ]);

  const health = { noAvatar, noBio, noBirth, noMovies, noPoster, noRating, noGenre };
  const issues = Object.values(health).reduce((s, n) => s + n, 0);
  // จำนวน "ช่องที่ควรมีข้อมูล" ทั้งหมด: ดารา 4 ช่อง (รูป/ประวัติ/วันเกิด/มีหนัง) + หนัง 3 ช่อง (โปสเตอร์/เรตติ้ง/ประเภท)
  const possible = actorCount * 4 + movieCount * 3;
  const score = possible ? Math.max(0, Math.round((1 - issues / possible) * 100)) : 100;

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
      .map((r) => ({ label: r.nationality ?? "ไม่ระบุ", value: r._count._all }))
      .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label)),
  };
}
