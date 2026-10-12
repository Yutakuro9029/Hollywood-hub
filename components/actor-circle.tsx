import Link from "next/link";
import { getInitials } from "@/lib/format";
import { getI18n } from "@/lib/i18n/server";
import { tmdbImage } from "@/lib/tmdb-image";

export type ActorCircleData = {
  id: number;
  name: string;
  nationality: string | null;
  avatar_url: string | null;
  awards_count: number | null;
  _count?: { credits: number };
};

/**
 * ดารา: รูปวงกลมขอบทอง ชื่อ สัญชาติ และจำนวนรางวัล
 * role = ใช้ในรายชื่อนักแสดงของหนัง (แสดง "รับบท ..." ใต้ชื่อ)
 */
export async function ActorCircle({
  actor,
  role,
  caption,
}: {
  actor: ActorCircleData;
  role?: string | null;
  /** ข้อความเด่นใต้ชื่อ เช่น "เกิด 12 ตุลาคม" */
  caption?: string;
}) {
  const { t } = await getI18n();
  return (
    <Link
      href={`/actors/${actor.id}`}
      className="group block rounded-card text-center focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-4 focus-visible:ring-offset-ink"
    >
      <span className="relative mx-auto block aspect-square w-full max-w-36 rounded-full bg-gold-gradient p-[2px] transition-shadow duration-300 group-hover:glow-gold">
        <span className="relative block h-full w-full overflow-hidden rounded-full bg-surface">
          {/* ตัวอักษรย่อใต้รูป เห็นแทนเมื่อรูปโหลดไม่ได้ */}
          <span aria-hidden className="absolute inset-0 flex items-center justify-center font-display text-2xl text-gold-light">
            {getInitials(actor.name)}
          </span>
          {actor.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tmdbImage(actor.avatar_url, "w185") ?? undefined}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-premium group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          )}
        </span>
      </span>
      <span className="mt-4 block truncate text-[15px] font-medium text-cream group-hover:text-gold-light">{actor.name}</span>
      {caption && <span className="mt-0.5 block truncate text-xs text-gold-light">{caption}</span>}
      {role !== undefined && (
        <span className="mt-0.5 block truncate text-xs text-cream/75" title={role ?? undefined}>
          {role ? t.common.asRole(role) : t.common.noRole}
        </span>
      )}
      <span className="mt-0.5 block truncate text-xs text-muted">{actor.nationality ?? t.common.noNationality}</span>
      <span className="mt-1 block text-xs text-gold-light">
        {t.common.awards(actor.awards_count)}
        {actor._count && <span className="text-muted"> / {t.common.films(actor._count.credits)}</span>}
      </span>
    </Link>
  );
}
