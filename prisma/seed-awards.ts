/**
 * ดึงรายละเอียดรางวัลของดาราจาก Wikidata ลงตาราง actor_awards
 *
 *   npm run seed:awards
 *
 * - ข้อมูลจริงจาก Wikidata: P166 (award received) + ปี (P585) + ผลงานที่ได้รางวัล (P1686)
 * - ชื่อรางวัลภาษาอังกฤษ และภาษาไทยถ้า Wikidata มี (ไม่แปลเอง)
 * - รันซ้ำได้: ลบรางวัลเดิมของดาราคนนั้นแล้วใส่ชุดใหม่ และอัปเดต awards_count ให้ตรงกับจำนวนรางวัล (ไม่นับซ้ำ)
 * - ดาราที่เพิ่มเองจากหลังบ้าน (ไม่มี tmdb_id) ไม่ถูกแตะ
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TMDB_API_KEY = process.env.TMDB_API_KEY?.trim();
const isBearer = TMDB_API_KEY?.startsWith("eyJ") ?? false;
const UA = { "User-Agent": "HollywoodHubSeed/1.0 (local development seed script)" };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Q-id ของดาราใน Wikidata ผ่าน TMDB external_ids */
async function wikidataIdOf(tmdbId: number): Promise<string | null> {
  const url = new URL(`https://api.themoviedb.org/3/person/${tmdbId}/external_ids`);
  if (!isBearer) url.searchParams.set("api_key", TMDB_API_KEY!);
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, { headers: isBearer ? { Authorization: `Bearer ${TMDB_API_KEY}` } : {} });
    if (res.ok) return ((await res.json()) as { wikidata_id?: string | null }).wikidata_id ?? null;
    if (res.status === 404) return null;
    if (res.status === 429 && attempt < 5) {
      await sleep(1000 * attempt);
      continue;
    }
    throw new Error(`TMDB external_ids ${tmdbId} → HTTP ${res.status}`);
  }
}

type Snak = { datavalue?: { value: { id?: string; time?: string } } };
type Claim = { rank: "preferred" | "normal" | "deprecated"; mainsnak: Snak; qualifiers?: Record<string, Snak[]> };
type Entity = { claims?: Record<string, Claim[]>; labels?: Record<string, { value: string }> };

/** wbgetentities ทีละ 50 รายการ (ขีดจำกัดของ API) */
async function entities(ids: string[], props: string): Promise<Record<string, Entity>> {
  const out: Record<string, Entity> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&format=json&languages=en|th&props=${props}&ids=${batch.join("|")}`;
    const res = await fetch(url, { headers: UA });
    if (!res.ok) throw new Error(`Wikidata HTTP ${res.status}`);
    Object.assign(out, ((await res.json()) as { entities: Record<string, Entity> }).entities);
  }
  return out;
}

const yearOf = (snaks?: Snak[]) => {
  const y = Number(snaks?.[0]?.datavalue?.value.time?.slice(1, 5));
  return Number.isInteger(y) && y > 1800 && y < 2200 ? y : null;
};

async function main() {
  if (!TMDB_API_KEY) throw new Error("กรุณาระบุ TMDB_API_KEY ในไฟล์ .env ก่อนรัน");

  const actors = await prisma.actors.findMany({ where: { tmdb_id: { not: null } }, select: { id: true, name: true, tmdb_id: true } });
  console.log(`กำลังหา Wikidata ID ของดารา ${actors.length} คน...`);

  const qidOf = new Map<number, string>(); // actors.id → Q-id
  for (let i = 0; i < actors.length; i += 8) {
    await Promise.all(
      actors.slice(i, i + 8).map(async (a) => {
        const qid = await wikidataIdOf(a.tmdb_id!);
        if (qid) qidOf.set(a.id, qid);
      }),
    );
  }

  const people = await entities([...new Set(qidOf.values())], "claims");

  // รวม Q-id ของรางวัลและผลงาน เพื่อดึงชื่อทีเดียว
  const labelIds = new Set<string>();
  for (const p of Object.values(people)) {
    for (const c of p.claims?.P166 ?? []) {
      if (c.rank === "deprecated") continue;
      const award = c.mainsnak.datavalue?.value.id;
      if (award) labelIds.add(award);
      const work = c.qualifiers?.P1686?.[0]?.datavalue?.value.id;
      if (work) labelIds.add(work);
    }
  }
  console.log(`กำลังดึงชื่อรางวัลและผลงาน ${labelIds.size} รายการ...`);
  const labels = await entities([...labelIds], "labels");
  const en = (q: string) => labels[q]?.labels?.en?.value ?? null;
  const thLabel = (q: string) => labels[q]?.labels?.th?.value ?? null;

  let total = 0;
  let withAwards = 0;
  for (const a of actors) {
    const qid = qidOf.get(a.id);
    const claims = qid ? (people[qid]?.claims?.P166 ?? []).filter((c) => c.rank !== "deprecated") : [];

    const rows = claims.flatMap((c) => {
      const award = c.mainsnak.datavalue?.value.id;
      const name = award ? en(award) : null;
      if (!award || !name) return []; // รางวัลที่ไม่มีชื่อภาษาอังกฤษ ข้าม (แสดงผลไม่ได้)
      const work = c.qualifiers?.P1686?.[0]?.datavalue?.value.id;
      return [{
        actor_id: a.id,
        award_qid: award,
        name_en: name.slice(0, 255),
        name_th: thLabel(award)?.slice(0, 255) ?? null,
        year: yearOf(c.qualifiers?.P585),
        for_work: work ? (en(work)?.slice(0, 255) ?? null) : null,
      }];
    });

    // จำนวนรางวัล = รางวัลที่ไม่ซ้ำกัน (นิยามเดียวกับ seed หลัก) — ไม่มีข้อมูล = null ไม่ใช่ 0
    const distinct = new Set(claims.map((c) => c.mainsnak.datavalue?.value.id).filter(Boolean)).size;
    await prisma.$transaction([
      prisma.actor_awards.deleteMany({ where: { actor_id: a.id } }),
      prisma.actor_awards.createMany({ data: rows }),
      ...(qid ? [prisma.actors.update({ where: { id: a.id }, data: { awards_count: distinct > 0 ? distinct : null } })] : []),
    ]);
    total += rows.length;
    if (rows.length) withAwards++;
  }
  console.log(`บันทึกรางวัล ${total} รายการ ของดารา ${withAwards} คน`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
