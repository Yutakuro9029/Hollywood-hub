"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Face, GoldBar, focusRing, goldLink } from "@/components/editorial";
import { useI18n } from "@/lib/i18n/client";

export type RankAward = { id: number; year: number | null; name: string; forWork: string | null };

const PREVIEW = 6;

/**
 * แถวทำเนียบรางวัลบนหน้าแรก: ชื่อ → หน้าดารา, ตัวเลขรางวัล → กางรายการรางวัลของคนนั้นใต้แถวทันที
 */
export function AwardRankRow({
  rank,
  actor,
  awards,
}: {
  rank: number;
  actor: { id: number; name: string; nationality: string | null; avatar_url: string | null; movieCount: number; awards: number; share: number };
  awards: RankAward[];
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li className="border-b border-line">
      <div className="grid grid-cols-[2.25rem_3.25rem_minmax(0,1fr)_auto] items-center gap-x-4 py-4">
        <span className="font-editorial text-2xl text-gold-light tabular-nums">{rank}</span>
        <Link href={`/actors/${actor.id}`} tabIndex={-1} aria-hidden>
          <Face name={actor.name} url={actor.avatar_url} className="h-13 w-13" />
        </Link>
        <span className="min-w-0">
          <Link href={`/actors/${actor.id}`} className={`block truncate rounded-sm text-lg text-cream transition-colors hover:text-gold-light ${focusRing}`}>
            {actor.name}
          </Link>
          <span className="mt-0.5 block text-xs text-muted">
            {actor.nationality ?? t.common.noNationality}, {t.common.moviesInSystem(actor.movieCount)}
          </span>
          {/* แถบทองยาวตามสัดส่วนรางวัลเทียบอันดับ 1 */}
          <GoldBar share={actor.share} />
        </span>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          aria-label={open ? t.home.hideAwards(actor.name) : t.home.showAwards(actor.name)}
          className={`group flex items-center gap-1.5 rounded-[4px] px-2 py-1 text-right transition-colors hover:bg-surface ${focusRing}`}
        >
          <span>
            <span className="block font-editorial text-3xl leading-none text-cream tabular-nums group-hover:text-gold-light">{actor.awards}</span>
            <span className="text-xs text-muted">{t.common.awardsUnit}</span>
          </span>
          <ChevronDown className={`h-4 w-4 text-gold-light transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden />
        </button>
      </div>

      {open && (
        <div id={panelId} className="animate-fade-slide pb-5 pl-[5.5rem] pr-2 max-sm:pl-0">
          {awards.length === 0 ? (
            <p className="text-sm text-muted">{t.home.noAwardDetails}</p>
          ) : (
            <ul className="space-y-2 border-l border-gold-dark pl-4">
              {awards.slice(0, PREVIEW).map((a) => (
                <li key={a.id} className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-x-3 text-sm">
                  <span className="font-editorial text-gold-light tabular-nums">{a.year ?? "—"}</span>
                  <span className="min-w-0 text-cream/85">
                    {a.name}
                    {a.forWork && <span className="block truncate text-xs text-muted">{t.actor.forWork(a.forWork)}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/actors/${actor.id}#awards`} className={`mt-4 inline-block text-sm ${goldLink}`}>
            {t.home.allAwards(awards.length)}
          </Link>
        </div>
      )}
    </li>
  );
}
