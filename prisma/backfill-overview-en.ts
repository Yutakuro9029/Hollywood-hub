/**
 * เติมเรื่องย่อภาษาอังกฤษ (movies.overview_en) ให้หนังที่มีอยู่แล้ว โดยไม่ต้องรัน seed ใหม่ทั้งชุด
 *
 *   npm run backfill:overview-en
 *
 * - แก้แค่คอลัมน์ overview_en ของหนังที่มี tmdb_id และยังว่างอยู่ ข้อมูลอื่น (รวมที่แอดมินแก้เอง) ไม่ถูกแตะ
 * - รันซ้ำได้: เรื่องที่เติมแล้วจะถูกข้าม
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim();
const isBearer = TMDB_API_KEY?.startsWith("eyJ") ?? false;
const CONCURRENCY = 8;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function englishOverview(tmdbId: number): Promise<string | null> {
  const url = new URL(`https://api.themoviedb.org/3/movie/${tmdbId}`);
  url.searchParams.set("language", "en-US");
  if (!isBearer) url.searchParams.set("api_key", TMDB_API_KEY!);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: isBearer ? { Authorization: `Bearer ${TMDB_API_KEY}` } : {} });
    if (res.ok) {
      const data = (await res.json()) as { overview?: string };
      return data.overview?.trim() || null;
    }
    if (res.status === 404) return null;
    // 429 = โดนจำกัดอัตรา → รอแล้วลองใหม่
    if (res.status === 429 && attempt < 5) {
      await sleep(Number(res.headers.get("retry-after") ?? 1) * 1000 * attempt);
      continue;
    }
    throw new Error(`TMDB /movie/${tmdbId} → HTTP ${res.status}`);
  }
}

async function main() {
  if (!TMDB_API_KEY) throw new Error("กรุณาระบุ TMDB_API_KEY ในไฟล์ .env ก่อนรัน");

  const movies = await prisma.movies.findMany({
    where: { tmdb_id: { not: null }, overview_en: null },
    select: { id: true, tmdb_id: true },
  });
  console.log(`หนังที่ยังไม่มีเรื่องย่อภาษาอังกฤษ: ${movies.length} เรื่อง`);

  let filled = 0;
  let empty = 0;
  for (let i = 0; i < movies.length; i += CONCURRENCY) {
    await Promise.all(
      movies.slice(i, i + CONCURRENCY).map(async (m) => {
        const overview = await englishOverview(m.tmdb_id!);
        if (overview) {
          await prisma.movies.update({ where: { id: m.id }, data: { overview_en: overview } });
          filled++;
        } else {
          empty++;
        }
      }),
    );
  }
  console.log(`เติมแล้ว ${filled} เรื่อง, TMDB ไม่มีเรื่องย่อภาษาอังกฤษ ${empty} เรื่อง`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
