import Link from "next/link";
import { Film, Star } from "lucide-react";
import { formatRating } from "@/lib/format";
import FavoriteButton from "@/components/favorite-button";

export type MovieCardData = {
  id: number;
  title: string;
  release_year: number | null;
  genre: string | null;
  poster_url: string | null;
  rating: { toString(): string } | null;
};

export function MovieCard({
  movie,
  actorNames,
}: {
  movie: MovieCardData;
  actorNames: string[];
}) {
  return (
    <article className="group relative rounded-xl has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-amber-400 has-[a:focus-visible]:ring-offset-2 has-[a:focus-visible]:ring-offset-zinc-50 dark:has-[a:focus-visible]:ring-offset-slate-950">
      <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-200 bg-gradient-to-br from-zinc-200 to-zinc-300 shadow-sm transition duration-200 group-hover:-translate-y-1 group-hover:border-amber-400/70 group-hover:shadow-lg dark:border-zinc-800 dark:from-zinc-800 dark:to-slate-900 dark:shadow-none">
        {/* fallback: แสดงใต้โปสเตอร์ ถ้ารูปโหลดไม่ได้ (alt ว่าง) จะเห็นไอคอนกับชื่อเรื่องแทน */}
        <div
          aria-hidden
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-zinc-500 dark:text-zinc-400"
        >
          <Film className="h-8 w-8" />
          <span className="line-clamp-3 text-xs font-medium">{movie.title}</span>
        </div>
        {movie.poster_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={movie.poster_url}
            alt=""
            loading="lazy"
            referrerPolicy="no-referrer"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <span
          className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-semibold text-amber-300 backdrop-blur"
          title="คะแนนจาก 10"
        >
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden />
          {formatRating(movie.rating)}
        </span>
      </div>

      {/* วางเป็นลูกตรงของ article (ไม่ใช่ในกรอบโปสเตอร์ที่ถูก translate ตอน hover)
          และใช้ z-10 เพื่อให้อยู่เหนือ stretched link ของการ์ด */}
      <FavoriteButton
        kind="movie"
        variant="overlay"
        item={{
          id: movie.id,
          title: movie.title,
          poster_url: movie.poster_url,
          rating: movie.rating === null ? null : Number(movie.rating.toString()),
          year: movie.release_year,
        }}
      />

      <div className="mt-3 space-y-0.5">
        <h3 className="line-clamp-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {/* stretched link: คลิกตรงไหนของการ์ดก็ไปหน้ารายละเอียด */}
          <Link
            href={`/movies/${movie.id}`}
            className="after:absolute after:inset-0 focus:outline-none"
          >
            {movie.title}
          </Link>
        </h3>
        <p className="truncate text-xs text-zinc-600 dark:text-zinc-400">
          {movie.release_year ?? "-"}
          {movie.genre && ` · ${movie.genre}`}
        </p>
        {actorNames.length > 0 && (
          <p className="truncate text-xs text-zinc-500">
            นำแสดงโดย {actorNames.join(", ")}
          </p>
        )}
      </div>
    </article>
  );
}
