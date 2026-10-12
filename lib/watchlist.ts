import "server-only";
import { prisma } from "@/lib/prisma";
import type { FavoriteActor, FavoriteMovie } from "@/lib/use-favorites";

export interface WatchlistData {
  movies: FavoriteMovie[];
  actors: FavoriteActor[];
}

/** รายการโปรดของผู้ใช้ (ล่าสุดก่อน) — แปลงเป็น plain object ให้ส่งเข้า Client Component ได้ */
export async function getWatchlist(userId: number): Promise<WatchlistData> {
  const [movies, actors] = await Promise.all([
    prisma.watchlist_movies.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        movie: {
          select: { id: true, title: true, poster_url: true, rating: true, release_year: true },
        },
      },
    }),
    prisma.watchlist_actors.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      select: {
        actor: { select: { id: true, name: true, avatar_url: true, nationality: true } },
      },
    }),
  ]);

  return {
    movies: movies.map(({ movie: m }) => ({
      id: m.id,
      title: m.title,
      poster_url: m.poster_url,
      rating: m.rating === null ? null : Number(m.rating),
      year: m.release_year,
    })),
    actors: actors.map(({ actor }) => actor),
  };
}
