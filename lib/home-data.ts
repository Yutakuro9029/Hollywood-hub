import "server-only";
import { prisma } from "@/lib/prisma";
import { calcAge } from "@/lib/format";

/*
 * หน้าแรกแบบ "ทำเนียบดารา" — ยึดหลักเว็บแนะนำนักแสดง (ดาราเป็นหลัก หนังเป็นบริบท)
 * ทุกส่วนคำนวณจากข้อมูลจริง: ดาราทั้งหมด + เครดิตนักแสดง (movie_cast) ชุดเดียว
 */

const actorSelect = {
  id: true,
  name: true,
  nationality: true,
  birth_date: true,
  avatar_url: true,
  awards_count: true,
  bio: true,
  _count: { select: { credits: true } },
} as const;

type ActorRow = Awaited<ReturnType<typeof loadActors>>[number];
type CastRow = Awaited<ReturnType<typeof loadCast>>[number];

function loadActors() {
  return prisma.actors.findMany({ select: actorSelect, orderBy: { name: "asc" } });
}

function loadCast() {
  return prisma.movie_cast.findMany({
    select: {
      actor_id: true,
      role_name: true,
      movie: {
        select: {
          id: true,
          title: true,
          release_year: true,
          popularity: true,
          poster_url: true,
          backdrop_url: true,
        },
      },
    },
  });
}

/** วันที่ปัจจุบันตามเวลาไทย */
function bangkokToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date());
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month") - 1, day: get("day") };
}

/** สัปดาห์ที่เท่าไรของปี (ใช้หมุนดาราประจำสัปดาห์ให้เปลี่ยนทุกสัปดาห์แบบคาดเดาได้) */
function weekOfYear({ year, month, day }: { year: number; month: number; day: number }) {
  const start = Date.UTC(year, 0, 1);
  return Math.floor((Date.UTC(year, month, day) - start) / (7 * 24 * 3600 * 1000));
}

export async function getHomeData() {
  const [actors, cast, latest] = await Promise.all([
    loadActors(),
    loadCast(),
    // ผลงานล่าสุดของดาราในระบบ พร้อมชื่อนักแสดง (หนังเป็นบริบทของดารา)
    prisma.movies.findMany({
      where: { release_date: { lte: new Date() }, cast: { some: {} } },
      orderBy: [{ release_date: "desc" }, { id: "asc" }],
      take: 12,
      select: {
        id: true,
        title: true,
        release_year: true,
        genre: true,
        poster_url: true,
        rating: true,
        cast: {
          orderBy: { billing_order: "asc" },
          take: 2,
          select: { actor: { select: { id: true, name: true } } },
        },
      },
    }),
  ]);

  const today = bangkokToday();
  const actorById = new Map(actors.map((a) => [a.id, a]));
  const creditsOf = new Map<number, CastRow[]>();
  const castOf = new Map<number, number[]>();
  const movieById = new Map<number, CastRow["movie"]>();
  for (const row of cast) {
    creditsOf.set(row.actor_id, [...(creditsOf.get(row.actor_id) ?? []), row]);
    castOf.set(row.movie.id, [...(castOf.get(row.movie.id) ?? []), row.actor_id]);
    movieById.set(row.movie.id, row.movie);
  }

  // กำแพงใบหน้า: ดาราทุกคนที่มีรูป คนละ 1 ช่อง เรียงตามรางวัล (ดาราดังที่สุดอยู่แถวบน)
  const wall = actors
    .filter((a) => a.avatar_url)
    .sort((a, b) => (b.awards_count ?? -1) - (a.awards_count ?? -1) || a.name.localeCompare(b.name))
    .map((a) => ({ id: a.id, name: a.name, avatar_url: a.avatar_url }));

  const stats = {
    actors: actors.length,
    nationalities: new Set(actors.map((a) => a.nationality).filter(Boolean)).size,
    awards: actors.reduce((s, a) => s + (a.awards_count ?? 0), 0),
  };

  return {
    wall,
    stats,
    featured: getFeatured(actors, creditsOf, today),
    ranking: await getRanking(actors),
    birthdays: getBirthdayCalendar(actors, today),
    pairs: getPairs(castOf, actorById, movieById),
    directory: getDirectory(actors),
    latest,
  };
}

/**
 * ดาราประจำสัปดาห์: เลือกจาก 10 ดาราที่หนังของพวกเขามาแรงที่สุด แล้วหมุนตามสัปดาห์ของปี
 * ต้องมีรูปและประวัติ
 */
function getFeatured(actors: ActorRow[], creditsOf: Map<number, CastRow[]>, today: ReturnType<typeof bangkokToday>) {
  const heat = (a: ActorRow) => Math.max(0, ...(creditsOf.get(a.id) ?? []).map((c) => Number(c.movie.popularity ?? 0)));
  const pool = actors
    .filter((a) => a.avatar_url && a.bio && (creditsOf.get(a.id)?.length ?? 0) > 0)
    .sort((a, b) => heat(b) - heat(a))
    .slice(0, 10);
  if (pool.length === 0) return null;

  const actor = pool[weekOfYear(today) % pool.length];
  const credits = [...(creditsOf.get(actor.id) ?? [])].sort(
    (a, b) => (b.movie.release_year ?? 0) - (a.movie.release_year ?? 0),
  );
  const backdrop = [...credits]
    .sort((a, b) => Number(b.movie.popularity ?? 0) - Number(a.movie.popularity ?? 0))
    .find((c) => c.movie.backdrop_url)?.movie.backdrop_url ?? null;

  // ย่อหน้าแรกของประวัติ (ประวัติเต็มอยู่ในหน้าดารา)
  const lead = (actor.bio ?? "").split(/\n\s*\n+/)[0]?.trim() ?? "";

  return {
    id: actor.id,
    name: actor.name,
    nationality: actor.nationality,
    age: calcAge(actor.birth_date),
    awards: actor.awards_count,
    avatar_url: actor.avatar_url,
    movieCount: actor._count.credits,
    lead,
    backdrop,
    credits: credits.slice(0, 6).map((c) => ({
      id: c.movie.id,
      title: c.movie.title,
      year: c.movie.release_year,
      role: c.role_name,
    })),
  };
}

/** ทำเนียบรางวัล: 10 อันดับ พร้อมสัดส่วนเทียบอันดับ 1 (ใช้วาดแถบทอง) */
/** 10 ดาราที่ได้รางวัลมากที่สุด พร้อมรายการรางวัล (ไว้กางดูบนหน้าแรก) */
async function getRanking(actors: ActorRow[]) {
  const ranked = actors
    .filter((a) => a.awards_count !== null)
    .sort((a, b) => (b.awards_count ?? 0) - (a.awards_count ?? 0) || a.name.localeCompare(b.name))
    .slice(0, 10);
  const max = ranked[0]?.awards_count ?? 1;
  const awardRows = await prisma.actor_awards.findMany({
    where: { actor_id: { in: ranked.map((a) => a.id) } },
    orderBy: [{ year: { sort: "desc", nulls: "last" } }, { name_en: "asc" }],
    select: { id: true, actor_id: true, year: true, name_en: true, name_th: true, for_work: true },
  });
  return ranked.map((a) => ({
    awardList: awardRows.filter((r) => r.actor_id === a.id),
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    avatar_url: a.avatar_url,
    awards: a.awards_count ?? 0,
    movieCount: a._count.credits,
    share: (a.awards_count ?? 0) / max,
  }));
}

/** ปฏิทินวันเกิดของเดือนนี้: ช่องว่างก่อนวันที่ 1 + ทุกวันของเดือน พร้อมดาราที่เกิดวันนั้น */
function getBirthdayCalendar(actors: ActorRow[], today: ReturnType<typeof bangkokToday>) {
  const firstWeekday = new Date(Date.UTC(today.year, today.month, 1)).getUTCDay(); // 0 = อาทิตย์
  const daysInMonth = new Date(Date.UTC(today.year, today.month + 1, 0)).getUTCDate();
  const byDay = new Map<number, ActorRow[]>();
  for (const a of actors) {
    if (a.birth_date && a.birth_date.getUTCMonth() === today.month) {
      const d = a.birth_date.getUTCDate();
      byDay.set(d, [...(byDay.get(d) ?? []), a]);
    }
  }
  const days = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    isToday: i + 1 === today.day,
    actors: (byDay.get(i + 1) ?? []).map((a) => ({
      id: a.id,
      name: a.name,
      avatar_url: a.avatar_url,
      turning: a.birth_date ? today.year - a.birth_date.getUTCFullYear() : null,
    })),
  }));
  return {
    year: today.year,
    month: today.month,
    leadingBlanks: firstWeekday,
    days,
    total: [...byDay.values()].reduce((s, list) => s + list.length, 0),
  };
}

/** ร่วมจอบ่อยที่สุด: คู่ดาราที่เล่นหนังเรื่องเดียวกันบ่อยที่สุด (อย่างน้อย 2 เรื่อง) */
function getPairs(
  castOf: Map<number, number[]>,
  actorById: Map<number, ActorRow>,
  movieById: Map<number, CastRow["movie"]>,
) {
  const pairs = new Map<string, { a: number; b: number; movies: number[] }>();
  for (const [movieId, ids] of castOf) {
    const sorted = [...new Set(ids)].sort((x, y) => x - y);
    for (let i = 0; i < sorted.length; i++) {
      for (let j = i + 1; j < sorted.length; j++) {
        const key = `${sorted[i]}-${sorted[j]}`;
        const cur = pairs.get(key) ?? { a: sorted[i], b: sorted[j], movies: [] };
        cur.movies.push(movieId);
        pairs.set(key, cur);
      }
    }
  }
  return [...pairs.values()]
    .filter((p) => p.movies.length >= 2)
    .sort((x, y) => y.movies.length - x.movies.length)
    .slice(0, 6)
    .map((p) => {
      const a = actorById.get(p.a);
      const b = actorById.get(p.b);
      if (!a || !b) return null;
      const movies = p.movies
        .map((id) => movieById.get(id)!)
        .sort((x, y) => Number(y.popularity ?? 0) - Number(x.popularity ?? 0))
        .map((m) => ({ id: m.id, title: m.title, year: m.release_year }));
      return {
        a: { id: a.id, name: a.name, avatar_url: a.avatar_url },
        b: { id: b.id, name: b.name, avatar_url: b.avatar_url },
        movies,
      };
    })
    .filter((p): p is NonNullable<typeof p> => p !== null);
}

/** ดัชนีดารา A–Z: จัดกลุ่มตามอักษรตัวแรกของชื่อ (ตัด accent เช่น Ō → O) */
function getDirectory(actors: ActorRow[]) {
  const groups = new Map<string, { id: number; name: string; nationality: string | null }[]>();
  for (const a of actors) {
    const first = a.name.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0).toUpperCase();
    const letter = /[A-Z]/.test(first) ? first : "#";
    groups.set(letter, [...(groups.get(letter) ?? []), { id: a.id, name: a.name, nationality: a.nationality }]);
  }
  return [...groups.entries()]
    .sort(([x], [y]) => (x === "#" ? 1 : y === "#" ? -1 : x.localeCompare(y)))
    .map(([letter, list]) => ({ letter, actors: list.sort((p, q) => p.name.localeCompare(q.name)) }));
}
