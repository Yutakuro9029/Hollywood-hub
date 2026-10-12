import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/dal";
import MoviesTable from "@/components/admin/movies-table";
import Pagination from "@/components/pagination";
import type { MovieRow } from "@/components/admin/movie-form";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function AdminMoviesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdmin();

  const { page: rawPage } = await searchParams;
  const total = await prisma.movies.count();
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  // ลบรายการสุดท้ายของหน้าสุดท้ายแล้ว ?page= อาจเกินจำนวนหน้า — ถอยมาหน้าสุดท้ายที่มีอยู่
  const page = Math.min(Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1), totalPages);

  const [movies, actors] = await Promise.all([
    prisma.movies.findMany({
      orderBy: { id: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        cast: {
          orderBy: { billing_order: "asc" },
          include: { actor: { select: { name: true } } },
        },
      },
    }),
    // ตัวเลือกนักแสดงในฟอร์ม ต้องมีครบทุกคน (ไม่แบ่งหน้า)
    prisma.actors.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  // Decimal ส่งข้าม Server→Client ไม่ได้ ต้องแปลงเป็น number
  const rows: MovieRow[] = movies.map((m) => ({
    id: m.id,
    cast: m.cast.map((c) => ({
      actorId: c.actor_id,
      actorName: c.actor.name,
      roleName: c.role_name,
    })),
    title: m.title,
    releaseYear: m.release_year,
    genre: m.genre,
    boxOfficeMil: m.box_office_mil ? m.box_office_mil.toNumber() : null,
    rating: m.rating ? m.rating.toNumber() : null,
    posterUrl: m.poster_url,
  }));

  return (
    <>
      <MoviesTable movies={rows} actors={actors} total={total} page={page} totalPages={totalPages} />
      <Pagination page={page} totalPages={totalPages} basePath="/admin/movies" />
    </>
  );
}
