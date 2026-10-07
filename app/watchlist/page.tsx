"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bookmark, Film, Star, Undo2, UserRound, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  useFavorites,
  type FavoriteActor,
  type FavoriteMovie,
} from "@/lib/use-favorites";
import { formatRating, getInitials } from "@/lib/format";
import { Skeleton, SkeletonRegion } from "@/components/ui/skeleton";

type TabKey = "movies" | "actors";

type Undo =
  | { kind: "movie"; item: FavoriteMovie }
  | { kind: "actor"; item: FavoriteActor };

const focusRing =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950";

const gridCls =
  "grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

const removeBtnCls = `absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-zinc-100 ring-1 ring-white/20 backdrop-blur-md transition-colors hover:bg-red-500 hover:text-white motion-reduce:transition-none ${focusRing}`;

/* ───────────────────────── Cards ───────────────────────── */

function MovieCard({
  movie,
  onRemove,
}: {
  movie: FavoriteMovie;
  onRemove: () => void;
}) {
  return (
    <li className="group relative">
      <Link
        href={`/movies/${movie.id}`}
        className={`block rounded-xl ${focusRing}`}
      >
        <div className="relative aspect-[2/3] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 transition-colors group-hover:border-amber-400/70 dark:border-zinc-800 dark:bg-slate-900">
          {movie.poster_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={movie.poster_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-zinc-400 dark:text-zinc-600">
              <Film className="h-10 w-10" aria-hidden />
            </div>
          )}
          {movie.rating !== null && (
            <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-slate-950/80 px-2 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
              <Star className="h-3 w-3" fill="currentColor" aria-hidden />
              {formatRating(movie.rating)}
            </span>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-base font-bold leading-snug text-zinc-900 dark:text-zinc-50">
          {movie.title}
        </h3>
        {movie.year !== null && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {movie.year}
          </p>
        )}
      </Link>
      <button
        type="button"
        onClick={onRemove}
        className={removeBtnCls}
        aria-label={`นำ ${movie.title} ออกจากรายการโปรด`}
        title="นำออก"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

function ActorCard({
  actor,
  onRemove,
}: {
  actor: FavoriteActor;
  onRemove: () => void;
}) {
  return (
    <li className="group relative">
      <Link
        href={`/actors/${actor.id}`}
        className={`block rounded-xl ${focusRing}`}
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-zinc-200 bg-zinc-200 transition-colors group-hover:border-amber-400/70 dark:border-zinc-800 dark:bg-slate-900">
          {actor.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={actor.avatar_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 font-display text-4xl font-bold text-amber-400">
              {getInitials(actor.name)}
            </div>
          )}
        </div>
        <h3 className="mt-3 line-clamp-2 font-display text-base font-bold leading-snug text-zinc-900 dark:text-zinc-50">
          {actor.name}
        </h3>
        {actor.nationality && (
          <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
            {actor.nationality}
          </p>
        )}
      </Link>
      <button
        type="button"
        onClick={onRemove}
        className={removeBtnCls}
        aria-label={`นำ ${actor.name} ออกจากรายการโปรด`}
        title="นำออก"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    </li>
  );
}

/* ───────────────────────── Empty state ─────────────────────────
   กรอบป้ายไฟโรงหนัง ใช้คลาส bulb-strip เดิมจาก globals.css */

const bulbColors =
  "[--bulb-core:#f59e0b] [--bulb-glow:rgba(245,158,11,0.25)] dark:[--bulb-core:#fde68a] dark:[--bulb-glow:rgba(251,191,36,0.4)]";

function EmptyState({
  icon: Icon,
  title,
  hint,
  href,
  cta,
}: {
  icon: LucideIcon;
  title: string;
  hint: React.ReactNode;
  href: string;
  cta: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white px-6 py-20 text-center dark:border-zinc-800 dark:bg-slate-900">
      <div
        aria-hidden
        className={`bulb-strip bulb-h inset-x-0 top-0 h-[22px] ${bulbColors}`}
      />
      <div
        aria-hidden
        className={`bulb-strip bulb-h inset-x-0 bottom-0 h-[22px] ${bulbColors}`}
      />

      <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-400/15 text-amber-600 ring-1 ring-amber-400/40 dark:text-amber-300">
        <Icon className="h-7 w-7" aria-hidden />
      </div>
      <h2 className="font-display text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
        {hint}
      </p>
      <Link
        href={href}
        className={`mt-7 inline-flex items-center justify-center rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-amber-500/20 transition-colors hover:bg-amber-300 motion-reduce:transition-none ${focusRing}`}
      >
        {cta}
      </Link>
    </div>
  );
}

const BookmarkHint = (
  <Bookmark
    className="mx-0.5 inline h-3.5 w-3.5 -translate-y-px text-amber-600 dark:text-amber-300"
    aria-label="บุ๊กมาร์ก"
  />
);

/* ───────────────────────── Page ───────────────────────── */

export default function WatchlistPage() {
  const {
    mounted,
    favoriteMovies,
    favoriteActors,
    totalCount,
    toggleMovie,
    toggleActor,
    removeMovie,
    removeActor,
    clearAll,
  } = useFavorites();

  const [tab, setTab] = useState<TabKey>("movies");
  const [undo, setUndo] = useState<Undo | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const tabRefs = useRef<Record<TabKey, HTMLButtonElement | null>>({
    movies: null,
    actors: null,
  });

  // ข้อความ "นำออกแล้ว — เลิกทำ" หายเองใน 6 วินาที
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(timer);
  }, [undo]);

  // ปุ่ม "ล้างทั้งหมด" ต้องกดซ้ำเพื่อยืนยัน และรีเซ็ตเองใน 4 วินาที
  useEffect(() => {
    if (!confirmClear) return;
    const timer = setTimeout(() => setConfirmClear(false), 4000);
    return () => clearTimeout(timer);
  }, [confirmClear]);

  function handleRemoveMovie(movie: FavoriteMovie) {
    removeMovie(movie.id);
    setUndo({ kind: "movie", item: movie });
  }

  function handleRemoveActor(actor: FavoriteActor) {
    removeActor(actor.id);
    setUndo({ kind: "actor", item: actor });
  }

  function handleUndo() {
    if (!undo) return;
    if (undo.kind === "movie") toggleMovie(undo.item);
    else toggleActor(undo.item);
    setUndo(null);
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    clearAll();
    setConfirmClear(false);
    setUndo(null);
  }

  function handleTabKeyDown(e: React.KeyboardEvent) {
    if (
      e.key !== "ArrowLeft" &&
      e.key !== "ArrowRight" &&
      e.key !== "Home" &&
      e.key !== "End"
    ) {
      return;
    }
    e.preventDefault();
    const next: TabKey =
      e.key === "Home"
        ? "movies"
        : e.key === "End"
          ? "actors"
          : tab === "movies"
            ? "actors"
            : "movies";
    setTab(next);
    tabRefs.current[next]?.focus();
  }

  const tabs: {
    key: TabKey;
    label: string;
    icon: LucideIcon;
    count: number;
  }[] = [
    {
      key: "movies",
      label: "ภาพยนตร์ที่บันทึกไว้",
      icon: Film,
      count: favoriteMovies.length,
    },
    {
      key: "actors",
      label: "ดาราคนโปรด",
      icon: UserRound,
      count: favoriteActors.length,
    },
  ];

  const undoName = undo
    ? undo.kind === "movie"
      ? undo.item.title
      : undo.item.name
    : "";

  return (
    <main className="mx-auto max-w-7xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      {/* ไฟวิ่งคั่นหัวหน้า */}
      <div className="relative mb-8 h-[22px]" aria-hidden>
        <div className={`bulb-strip bulb-h inset-0 ${bulbColors}`} />
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
            รายการโปรดของฉัน
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
            เก็บเรื่องที่อยากดูและดาราที่ติดตามไว้ในที่เดียว
            รายการนี้บันทึกไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น
          </p>
        </div>

        {mounted && totalCount > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={`rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors motion-reduce:transition-none ${focusRing} ${
              confirmClear
                ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                : "border-zinc-300 text-zinc-600 hover:border-red-400 hover:text-red-600 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-red-400"
            }`}
          >
            {confirmClear
              ? "กดอีกครั้งเพื่อล้างทั้งหมด"
              : "ล้างรายการโปรดทั้งหมด"}
          </button>
        )}
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="ประเภทรายการโปรด"
        onKeyDown={handleTabKeyDown}
        className="mt-8 flex gap-1 border-b border-zinc-200 dark:border-zinc-800"
      >
        {tabs.map(({ key, label, icon: Icon, count }) => {
          const selected = tab === key;
          return (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              type="button"
              role="tab"
              id={`watchlist-tab-${key}`}
              aria-selected={selected}
              aria-controls={`watchlist-panel-${key}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setTab(key)}
              className={`relative -mb-px inline-flex items-center gap-2 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-3 text-sm font-medium transition-colors motion-reduce:transition-none ${focusRing} ${
                selected
                  ? "border-amber-400 text-amber-700 dark:text-amber-300"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
              {mounted && (
                <span
                  className={`min-w-5 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold ${
                    selected
                      ? "bg-amber-400 text-slate-950"
                      : "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      <div
        role="tabpanel"
        id={`watchlist-panel-${tab}`}
        aria-labelledby={`watchlist-tab-${tab}`}
        className="mt-8"
      >
        {!mounted ? (
          <SkeletonRegion className={gridCls}>
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton
                  className={
                    tab === "movies"
                      ? "aspect-[2/3] rounded-xl"
                      : "aspect-[4/5] rounded-xl"
                  }
                />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ))}
          </SkeletonRegion>
        ) : tab === "movies" ? (
          favoriteMovies.length === 0 ? (
            <EmptyState
              icon={Film}
              title="ยังไม่มีภาพยนตร์ที่บันทึกไว้"
              hint={
                <>
                  กดไอคอน{BookmarkHint}บนโปสเตอร์
                  เพื่อเก็บเรื่องที่อยากดูไว้ที่นี่
                </>
              }
              href="/movies"
              cta="สำรวจภาพยนตร์เด่น"
            />
          ) : (
            <ul role="list" className={gridCls}>
              {favoriteMovies.map((movie) => (
                <MovieCard
                  key={movie.id}
                  movie={movie}
                  onRemove={() => handleRemoveMovie(movie)}
                />
              ))}
            </ul>
          )
        ) : favoriteActors.length === 0 ? (
          <EmptyState
            icon={UserRound}
            title="ยังไม่มีดาราคนโปรด"
            hint={
              <>
                กดไอคอน{BookmarkHint}ข้างชื่อดารา
                เพื่อติดตามคนที่คุณชอบไว้ที่นี่
              </>
            }
            href="/actors"
            cta="ดูรายชื่อดารา"
          />
        ) : (
          <ul role="list" className={gridCls}>
            {favoriteActors.map((actor) => (
              <ActorCard
                key={actor.id}
                actor={actor}
                onRemove={() => handleRemoveActor(actor)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* แถบเลิกทำหลังนำออก */}
      {undo && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center justify-between gap-4 rounded-xl border border-zinc-700 bg-slate-900 px-4 py-3 text-sm text-zinc-100 shadow-xl shadow-black/30"
        >
          <span className="min-w-0 truncate">นำ {undoName} ออกแล้ว</span>
          <button
            type="button"
            onClick={handleUndo}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 font-semibold text-amber-300 transition-colors hover:bg-amber-400/10 motion-reduce:transition-none ${focusRing}`}
          >
            <Undo2 className="h-4 w-4" aria-hidden />
            เลิกทำ
          </button>
        </div>
      )}
    </main>
  );
}
