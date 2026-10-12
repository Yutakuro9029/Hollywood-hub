import Link from "next/link";
import { calcAge, getInitials } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { tmdbImage } from "@/lib/tmdb-image";
import FavoriteButton from "@/components/favorite-button";

export type ActorPortraitData = {
  id: number;
  name: string;
  nationality: string | null;
  birth_date: Date | null;
  avatar_url: string | null;
  awards_count: number | null;
  _count: { credits: number };
  /** ชื่อผลงานเด่น (ไม่บังคับ) */
  knownFor?: string[];
};

/**
 * การ์ดดาราแบบแฟ้มรูปนักแสดง (headshot) — ภาพขาวดำจาง ชี้แล้วเป็นสีพร้อมกรอบทอง เหมือนกำแพงใบหน้าหน้าแรก
 * ชื่อ/ข้อมูลอยู่ใต้ภาพ ไม่ซ้อนบนภาพ
 */
export async function ActorPortraitCard({ actor, priority = false }: { actor: ActorPortraitData; priority?: boolean }) {
  const { t } = await getI18n();
  const age = calcAge(actor.birth_date);

  return (
    <article className="group relative">
      <Link
        href={`/actors/${actor.id}`}
        className="block rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {/* หรี่ภาพด้วย brightness (ไม่ใช้ opacity — ไม่งั้นตัวอักษรย่อด้านหลังจะทะลุขึ้นมา) */}
          {actor.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tmdbImage(actor.avatar_url, "w342") ?? undefined}
              alt=""
              loading={priority ? "eager" : "lazy"}
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover object-top brightness-[.8] grayscale transition duration-500 ease-premium group-hover:scale-[1.03] group-hover:brightness-100 group-hover:grayscale-0 group-focus-visible:brightness-100 group-focus-visible:grayscale-0 motion-reduce:transition-none"
            />
          ) : (
            <span aria-hidden className="absolute inset-0 flex items-center justify-center font-editorial text-4xl text-gold-light">
              {getInitials(actor.name)}
            </span>
          )}
          <span aria-hidden className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-transparent transition group-hover:ring-gold" />
        </div>

        <h3 className="mt-3 font-editorial text-xl leading-snug text-cream transition-colors group-hover:text-gold-light">
          {actor.name}
        </h3>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-muted">
          <span>{actor.nationality ?? t.common.noNationality}</span>
          {age !== null && <span>{t.common.ageShort(age)}</span>}
        </p>
        <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
          <span className="text-gold-light">{t.common.awards(actor.awards_count)}</span>
          <span className="text-muted">{t.common.films(actor._count.credits)}</span>
        </p>
        {actor.knownFor && actor.knownFor.length > 0 && (
          <p className="mt-1.5 line-clamp-1 text-xs text-cream/60">{actor.knownFor.join(", ")}</p>
        )}
      </Link>

      <FavoriteButton
        kind="actor"
        variant="overlay"
        item={{ id: actor.id, name: actor.name, avatar_url: actor.avatar_url, nationality: actor.nationality }}
      />
    </article>
  );
}
