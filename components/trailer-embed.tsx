"use client";

import { useState } from "react";
import { Play } from "lucide-react";
import { useI18n } from "@/lib/i18n/client";

/**
 * ตัวอย่างหนังแบบฝัง: แสดงภาพปกจาก YouTube ก่อน แล้วโหลด iframe เมื่อกดเล่น
 * (iframe ของ YouTube หนักหลายร้อย KB — ไม่โหลดจนกว่าผู้ใช้จะอยากดู)
 */
export default function TrailerEmbed({ videoKey, title }: { videoKey: string; title: string }) {
  const [playing, setPlaying] = useState(false);
  const { t } = useI18n();

  return (
    <div className="relative aspect-video overflow-hidden rounded-card border border-line bg-black">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoKey}?autoplay=1&rel=0`}
          title={t.movie.trailerFrame(title)}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full focus:outline-none"
          aria-label={t.movie.trailerPlay(title)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoKey}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-70 transition-opacity duration-300 group-hover:opacity-90"
          />
          <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold-gradient text-ink shadow-lg transition-transform duration-300 group-hover:scale-110 group-focus-visible:ring-2 group-focus-visible:ring-gold-light group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-ink motion-reduce:transition-none sm:h-20 sm:w-20">
              <Play className="ml-1 h-7 w-7 fill-current" aria-hidden />
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
