import Link from "next/link";
import type { ReactNode } from "react";
import RowScroller from "@/components/row-scroller";
import { MovieCard, type MovieCardData } from "@/components/movie-card";
import { getI18n } from "@/lib/i18n/server";

/** หัวข้อ section: serif + เส้นทองบาง ๆ ใต้หัวข้อ ลิงก์ "ดูทั้งหมด" ชิดขวา */
export async function SectionHeader({
  id,
  title,
  description,
  href,
  linkLabel,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
}) {
  const { t } = await getI18n();
  return (
    <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-4 sm:px-6 lg:px-10">
      <div>
        <h2 id={id} className="font-serif text-2xl font-semibold text-cream sm:text-[28px]">
          {title}
        </h2>
        <span aria-hidden className="mt-3 block h-px w-12 bg-gold" />
        {description && <p className="mt-3 max-w-xl text-sm text-muted">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 rounded-sm pb-1 text-sm text-gold-light underline decoration-gold-dark underline-offset-[6px] transition-colors hover:decoration-gold focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
        >
          {linkLabel ?? t.common.viewAll}
        </Link>
      )}
    </div>
  );
}

/** แถวโปสเตอร์เลื่อนแนวนอน */
export function MovieRow({
  id,
  title,
  description,
  href,
  linkLabel,
  movies,
}: {
  id: string;
  title: string;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  movies: MovieCardData[];
}) {
  if (movies.length === 0) return null;
  return (
    <section aria-labelledby={id} className="mt-16 sm:mt-20">
      <SectionHeader id={id} title={title} description={description} href={href} linkLabel={linkLabel} />
      <div className="mt-5">
        <RowScroller label={title}>
          {movies.map((movie) => (
            <li key={movie.id} className="w-[38vw] max-w-44 shrink-0 snap-start sm:w-44 lg:w-48 lg:max-w-48">
              <MovieCard movie={movie} />
            </li>
          ))}
        </RowScroller>
      </div>
    </section>
  );
}
