import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * แนวหนังที่ไม่ซ้ำพร้อมจำนวนเรื่อง เรียงจากมากไปน้อย
 * (genre ในฐานข้อมูลเก็บเป็นข้อความคั่นด้วย "," เช่น "Sci-Fi, Action")
 */
export async function getGenreCounts(): Promise<{ genre: string; count: number }[]> {
  const rows = await prisma.movies.findMany({
    select: { genre: true },
    where: { genre: { not: null } },
  });

  const counts = new Map<string, number>();
  for (const { genre } of rows) {
    for (const part of (genre ?? "").split(",")) {
      const name = part.trim();
      if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }

  return Array.from(counts, ([genre, count]) => ({ genre, count })).sort(
    (a, b) => b.count - a.count || a.genre.localeCompare(b.genre),
  );
}

/** สัญชาติของดาราที่ไม่ซ้ำ เรียงตามตัวอักษร */
export async function getNationalities(): Promise<string[]> {
  const rows = await prisma.actors.findMany({
    select: { nationality: true },
    where: { nationality: { not: null } },
    distinct: ["nationality"],
    orderBy: { nationality: "asc" },
  });
  return rows
    .map((row) => row.nationality)
    .filter((value): value is string => Boolean(value));
}

/**
 * เงื่อนไขกรองแนวหนังแบบ "ตรงทั้งคำ" (genre เก็บเป็น "A, B, C" คั่นด้วย ", ")
 * ใช้แทน contains ซึ่งจะจับคำบางส่วน เช่น "Fiction" ไปตรงกับ "Science Fiction"
 */
export function genreWhere(genre: string): Prisma.moviesWhereInput {
  return {
    OR: [
      { genre },
      { genre: { startsWith: `${genre}, ` } },
      { genre: { endsWith: `, ${genre}` } },
      { genre: { contains: `, ${genre}, ` } },
    ],
  };
}

export type GenreOverview = {
  genre: string;
  count: number;
  /** ภาพฉากจากเรื่องที่นิยมที่สุดในแนวนี้ */
  cover: { title: string; backdrop_url: string | null; poster_url: string | null } | null;
  /** ดาราที่เล่นแนวนี้บ่อยที่สุด */
  actors: { id: number; name: string; avatar_url: string | null; count: number }[];
};

/** ข้อมูลสำหรับหน้าเลือกหมวดหมู่: จำนวนเรื่อง ภาพปก และดาราประจำแนว (เรียงตามจำนวนเรื่อง) */
export async function getGenreOverview(): Promise<GenreOverview[]> {
  const movies = await prisma.movies.findMany({
    where: { genre: { not: null } },
    orderBy: { popularity: { sort: "desc", nulls: "last" } },
    select: {
      title: true,
      genre: true,
      backdrop_url: true,
      poster_url: true,
      cast: { select: { actor: { select: { id: true, name: true, avatar_url: true } } } },
    },
  });

  type Cover = NonNullable<GenreOverview["cover"]>;
  type Acc = GenreOverview & { actorMap: Map<number, GenreOverview["actors"][number]>; covers: Cover[] };
  const byGenre = new Map<string, Acc>();
  for (const m of movies) {
    for (const part of (m.genre ?? "").split(",")) {
      const genre = part.trim();
      if (!genre) continue;
      let g = byGenre.get(genre);
      if (!g) {
        g = { genre, count: 0, cover: null, actors: [], actorMap: new Map(), covers: [] };
        byGenre.set(genre, g);
      }
      g.count++;
      // ตัวเลือกภาพปก: เรื่องที่มีภาพฉาก เรียงตามความนิยมอยู่แล้ว
      if (m.backdrop_url && g.covers.length < 20) g.covers.push({ title: m.title, backdrop_url: m.backdrop_url, poster_url: m.poster_url });
      for (const { actor } of m.cast) {
        const a = g.actorMap.get(actor.id) ?? { ...actor, count: 0 };
        a.count++;
        g.actorMap.set(actor.id, a);
      }
    }
  }

  // แนวใหญ่ได้เลือกปกก่อน และห้ามใช้เรื่องซ้ำกับแนวอื่น (หนังหลายแนวจะได้ไม่เป็นปกหลายช่อง)
  const used = new Set<string>();
  return Array.from(byGenre.values())
    .sort((a, b) => b.count - a.count || a.genre.localeCompare(b.genre))
    .map(({ actorMap, covers, ...g }) => {
      const cover = covers.find((c) => !used.has(c.title)) ?? covers[0] ?? null;
      if (cover) used.add(cover.title);
      return {
        ...g,
        cover,
        actors: Array.from(actorMap.values())
          .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
          .slice(0, 4),
      };
    });
}
