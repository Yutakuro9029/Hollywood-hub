import Link from "next/link";
import { Film, Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import { tmdbImage } from "@/lib/tmdb-image";
import FavoriteButton from "@/components/favorite-button";
import { getI18n } from "@/lib/i18n/server";

export type MovieCardData = {
  id: number;
  title: string;
  release_year: number | null;
  genre: string | null;
  poster_url: string | null;
  rating: { toString(): string } | null;
};

/**
 * การ์ดโปสเตอร์ 2:3 — hover แล้วขยายเล็กน้อย ขอบเรืองทอง และแสดงปุ่มดูรายละเอียด
 * คะแนนแสดงตลอด (จอสัมผัสไม่มี hover)
 */
export async function MovieCard({
  movie,
  actorNames,
  role,
  caption,
  priority = false,
}: {
  movie: MovieCardData;
  /** แสดงใต้ชื่อเรื่อง (ใช้ในหน้ารายการหนัง) */
  actorNames?: string[];
  /** บทบาทของดารา (ใช้ในผลงานของดารา) */
  role?: string | null;
  /** ข้อความเสริมสีทอง เช่น รายได้ */
  caption?: string;
  /** การ์ดที่อยู่ในจอแรก: โหลดรูปทันที ไม่ lazy */
  priority?: boolean;
}) {
  const { t } = await getI18n();
  const rating = movie.rating === null ? null : Number(movie.rating.toString());
  const firstGenre = movie.genre?.split(",")[0]?.trim();

  return (
    <article className="group relative">
      <Link
        href={`/movies/${movie.id}`}
        className="block rounded-card focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-card border border-line bg-surface transition duration-300 ease-premium group-hover:scale-[1.03] group-hover:border-transparent group-hover:glow-gold motion-reduce:transition-none motion-reduce:group-hover:scale-100">
          {/* fallback ใต้รูป: ถ้ารูปโหลดไม่ได้จะเห็นชื่อเรื่องแทน */}
          <div aria-hidden className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-muted">
            <Film className="h-6 w-6" />
            <span className="line-clamp-3 font-display text-sm">{movie.title}</span>
          </div>
          {movie.poster_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tmdbImage(movie.poster_url, "w342") ?? undefined}
              alt=""
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {rating !== null && (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-[4px] bg-ink/80 px-1.5 py-0.5 text-xs font-medium text-cream backdrop-blur-sm">
              <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
              {formatRating(movie.rating)}
              <span className="sr-only">{t.common.outOf10}</span>
            </span>
          )}

          {/* ปุ่มดูรายละเอียด: โผล่ตอน hover/focus (ตัวลิงก์ครอบทั้งการ์ดอยู่แล้ว) */}
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 flex translate-y-2 items-end bg-gradient-to-t from-ink via-ink/70 to-transparent p-3 pt-12 opacity-0 transition duration-300 ease-premium group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:transition-none"
          >
            <span className="w-full rounded-[4px] border border-gold/70 py-1.5 text-center text-xs font-medium text-gold-light">
              {t.common.details}
            </span>
          </div>
        </div>

        <h3 className="mt-3 line-clamp-1 text-[15px] font-medium text-cream transition-colors group-hover:text-gold-light">
          {movie.title}
        </h3>
        <p className="mt-0.5 flex gap-2 text-xs text-muted">
          {movie.release_year && <span>{movie.release_year}</span>}
          {firstGenre && <span>{t.common.genre(firstGenre)}</span>}
        </p>
        {role && <p className="mt-1 line-clamp-1 text-xs text-cream/75">{t.common.asRole(role)}</p>}
        {caption && <p className="mt-0.5 text-xs text-gold-light">{caption}</p>}
        {actorNames && actorNames.length > 0 && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{t.common.starring(actorNames.join(", "))}</p>
        )}
      </Link>

      {/* ปุ่มบันทึก: sibling ของลิงก์ (ห้ามซ้อน button ใน a) ทับมุมขวาบน */}
      <FavoriteButton
        kind="movie"
        variant="overlay"
        item={{
          id: movie.id,
          title: movie.title,
          poster_url: movie.poster_url,
          rating,
          year: movie.release_year,
        }}
      />
    </article>
  );
}
