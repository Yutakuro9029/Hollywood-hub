import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import ActorsTable from "@/components/admin/actors-table";
import Pagination from "@/components/pagination";
import type { ActorRow } from "@/components/admin/actor-form";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminActorsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();

  const { page: rawPage } = await searchParams;
  const total = await prisma.actors.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // ลบรายการสุดท้ายของหน้าสุดท้ายแล้ว ?page= อาจเกินจำนวนหน้า — ถอยมาหน้าสุดท้ายที่มีอยู่
  const page = Math.min(Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1), totalPages);

  const actors = await prisma.actors.findMany({
    orderBy: { id: "asc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: { _count: { select: { credits: true } } },
  });

  // แปลงเป็น plain object (Date → string) ก่อนส่งให้ Client Component
  const rows: ActorRow[] = actors.map((a) => ({
    id: a.id,
    name: a.name,
    nationality: a.nationality,
    birthDate: a.birth_date ? a.birth_date.toISOString().slice(0, 10) : null,
    bio: a.bio,
    avatarUrl: a.avatar_url,
    awardsCount: a.awards_count,
    movieCount: a._count.credits,
  }));

  return (
    <>
      <ActorsTable actors={rows} total={total} page={page} totalPages={totalPages} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/actors" />
    </>
  );
}
