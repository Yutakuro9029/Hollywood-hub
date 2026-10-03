import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import MoviesTable from "@/components/admin/movies-table";
import type { MovieRow } from "@/components/admin/movie-form";

export const dynamic = "force-dynamic";

export default async function AdminMoviesPage() {
  await requireAdmin();

  const [movies, actors] = await Promise.all([
    prisma.movies.findMany({
      orderBy: { id: "asc" },
      include: { actors: { select: { name: true } } },
    }),
    prisma.actors.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Decimal ส่งข้าม Server→Client ไม่ได้ ต้องแปลงเป็น number
  const rows: MovieRow[] = movies.map((m) => ({
    id: m.id,
    actorId: m.actor_id,
    actorName: m.actors.name,
    title: m.title,
    releaseYear: m.release_year,
    genre: m.genre,
    roleName: m.role_name,
    boxOfficeMil: m.box_office_mil.toNumber(),
    rating: m.rating ? m.rating.toNumber() : null,
    posterUrl: m.poster_url,
  }));

  return <MoviesTable movies={rows} actors={actors} />;
}
