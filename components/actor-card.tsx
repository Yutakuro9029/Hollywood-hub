import Link from "next/link";
import { Award, Film, Globe2, Star } from "lucide-react";
import { calcAge, formatRating, getInitials } from "@/lib/format";
import FavoriteButton from "@/components/favorite-button";

export type ActorCardData = {
  id: number;
  name: string;
  nationality: string | null;
  birth_date: Date | null;
  bio: string | null;
  avatar_url: string | null;
  awards_count: number;
  _count: { movies: number };
  movies: {
    id: number;
    title: string;
    release_year: number | null;
    genre: string | null;
    role_name: string | null;
    rating: { toString(): string } | null;
  }[];
};

export function ActorCard({ actor }: { actor: ActorCardData }) {
  const age = calcAge(actor.birth_date);

  return (
    <article className="relative flex h-full flex-col overflow-hidden rounded-2xl has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-amber-400 border border-zinc-200 bg-white shadow-sm transition hover:border-amber-400/70 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none dark:hover:border-amber-400/50">
      <div className="flex items-center gap-4 p-5">
        {/* ตัวอักษรย่อวางใต้รูป ถ้ารูปโหลดไม่ได้ (alt ว่าง) จะเห็นตัวอักษรย่อแทน */}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 ring-2 ring-amber-500/70 dark:from-zinc-800 dark:to-slate-900 dark:ring-amber-400/70">
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-amber-600 dark:text-amber-400"
          >
            {getInitials(actor.name)}
          </span>
          {actor.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actor.avatar_url}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 truncate text-lg font-bold text-zinc-900 dark:text-white">
              {/* stretched link: คลิกตรงไหนของการ์ดก็ไปหน้ารายละเอียด */}
              <Link
                href={`/actors/${actor.id}`}
                className="after:absolute after:inset-0 focus:outline-none"
              >
                {actor.name}
              </Link>
            </h3>
            {/* relative z-10: ให้อยู่เหนือ stretched link จึงกดได้โดยไม่พาไปหน้ารายละเอียด */}
            <FavoriteButton
              kind="actor"
              variant="icon"
              className="relative z-10 -mt-1"
              item={{
                id: actor.id,
                name: actor.name,
                avatar_url: actor.avatar_url,
                nationality: actor.nationality,
              }}
            />
          </div>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
            <Globe2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {actor.nationality ?? "ไม่ระบุสัญชาติ"}
              {age !== null && ` · ${age} ปี`}
            </span>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-500/30 dark:bg-amber-400/15 dark:text-amber-300 dark:ring-amber-400/30">
              <Award className="h-3.5 w-3.5" aria-hidden />
              {actor.awards_count} รางวัล
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2.5 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              <Film className="h-3.5 w-3.5" aria-hidden />
              {actor._count.movies} เรื่อง
            </span>
          </div>
        </div>
      </div>

      {actor.bio && (
        <p className="line-clamp-3 px-5 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
          {actor.bio}
        </p>
      )}

      <div className="mt-auto p-5 pt-4">
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          <Film className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden />
          ภาพยนตร์เด่น
        </p>
        {actor.movies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-zinc-300 px-3 py-4 text-center text-sm text-zinc-500 dark:border-zinc-700">
            ยังไม่มีข้อมูลภาพยนตร์
          </p>
        ) : (
          <ul className="space-y-2.5">
            {actor.movies.map((movie) => (
              <li
                key={movie.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-100 p-3 dark:border-zinc-800 dark:bg-slate-950/60"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-zinc-900 dark:text-zinc-100">
                    {movie.title}
                    {movie.release_year && (
                      <span className="ml-1.5 text-xs font-normal text-zinc-500">
                        ({movie.release_year})
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-600 dark:text-zinc-400">
                    {movie.genre ?? "ไม่ระบุแนว"}
                  </p>
                  {movie.role_name && (
                    <p className="mt-0.5 truncate text-xs text-zinc-500">
                      รับบท {movie.role_name}
                    </p>
                  )}
                </div>
                <span
                  className="inline-flex shrink-0 items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-sm font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
                  title="คะแนนจาก 10"
                >
                  <Star
                    className="h-4 w-4 fill-amber-500 text-amber-500 dark:fill-amber-400 dark:text-amber-400"
                    aria-hidden
                  />
                  {formatRating(movie.rating)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
