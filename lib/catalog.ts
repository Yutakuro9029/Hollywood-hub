import "server-only";
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
