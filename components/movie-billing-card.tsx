import Link from "next/link";
import { Film, Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import { tmdbImage } from "@/lib/tmdb-image";
import FavoriteButton from "@/components/favorite-button";
import { Face, focusRing } from "@/components/editorial";
import { getI18n } from "@/lib/i18n/server";

export type MovieBillingData = {
  id: number;
  title: string;
  release_year: number | null;
  genre: string | null;
  poster_url: string | null;
  rating: { toString(): string } | null;
  cast: { role_name: string | null; actor: { id: number; name: string; avatar_url: string | null } }[];
};

/**
 * การ์ดหนังแบบ "ใบปิดพร้อมรายชื่อนักแสดง" สไตล์ทำเนียบดารา
 * ดาราเป็นตัวเอก: ใต้โปสเตอร์มีรูปวงกลมขอบทองและชื่อดาราที่กดไปหน้าดาราได้
 */
export async function MovieBillingCard({
  movie,
  rank,
  priority = false,
}: {
  movie: MovieBillingData;
  /** ลำดับ (หน้า "ยอดนิยม") แสดงเป็นตัวเลขใหญ่มุมซ้ายบน */
  rank?: number;
  priority?: boolean;
}) {
  const { t } = await getI18n();
  const rating = movie.rating === null ? null : Number(movie.rating.toString());
  const firstGenre = movie.genre?.split(",")[0]?.trim();
  const cast = movie.cast.slice(0, 3);

  return (
    <article className="group relative">
      <Link
        href={`/movies/${movie.id}`}
        className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-surface">
          <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted">
            <Film className="h-6 w-6" />
            <span className="line-clamp-3 font-editorial text-sm">{movie.title}</span>
          </div>
          {movie.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tmdbImage(movie.poster_url, "w342") ?? undefined}
              alt=""
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover brightness-[.85] transition duration-500 ease-premium group-hover:scale-[1.03] group-hover:brightness-100 motion-reduce:transition-none"
            />
          )}
          {rank !== undefined && (
            <span
              aria-hidden
              className="absolute bottom-0 left-0 bg-gradient-to-tr from-ink/90 via-ink/40 to-transparent pb-1 pl-2 pr-8 pt-8 font-editorial text-5xl italic leading-none text-gold-light"
            >
              {rank}
            </span>
          )}
          <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-line transition group-hover:ring-gold" />
        </div>

        <h3 className="mt-3 line-clamp-2 font-editorial text-lg leading-snug text-cream transition-colors group-hover:text-gold-light">
          {rank !== undefined && <span className="sr-only">{t.common.rank(rank)} </span>}
          {movie.title}
        </h3>
        <p className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
          {movie.release_year && <span className="tabular-nums">{movie.release_year}</span>}
          {firstGenre && <span>{t.common.genre(firstGenre)}</span>}
          {rating !== null && (
            <span className="inline-flex items-center gap-1 text-cream/80">
              <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
              {formatRating(movie.rating)}
              <span className="sr-only">{t.common.outOf10}</span>
            </span>
          )}
        </p>
      </Link>

      {/* รายชื่อนักแสดง: ลิงก์ไปหน้าดารา (อยู่นอกลิงก์หนัง ห้ามซ้อน a ใน a) */}
      {cast.length > 0 && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3" aria-label={t.movies.castOf(movie.title)}>
          {cast.map(({ actor }) => (
            <li key={actor.id}>
              <Link
                href={`/actors/${actor.id}`}
                className={`flex items-center gap-2 rounded-sm text-xs text-cream/75 transition-colors hover:text-gold-light ${focusRing}`}
              >
                <Face name={actor.name} url={actor.avatar_url} className="h-6 w-6" size="w92" />
                <span className="truncate">{actor.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <FavoriteButton
        kind="movie"
        variant="overlay"
        item={{ id: movie.id, title: movie.title, poster_url: movie.poster_url, rating, year: movie.release_year }}
      />
    </article>
  );
}
