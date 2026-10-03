import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import ActorsTable from "@/components/admin/actors-table";
import type { ActorRow } from "@/components/admin/actor-form";

export const dynamic = "force-dynamic";

export default async function AdminActorsPage() {
  await requireAdmin();

  const actors = await prisma.actors.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { movies: true } } },
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
    movieCount: a._count.movies,
  }));

  return <ActorsTable actors={rows} />;
}
