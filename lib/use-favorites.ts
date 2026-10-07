"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

/* ───────────────────────── Types ───────────────────────── */

export interface FavoriteMovie {
  id: number;
  title: string;
  poster_url: string | null;
  rating: number | null;
  year: number | null;
}

export interface FavoriteActor {
  id: number;
  name: string;
  avatar_url: string | null;
  nationality: string | null;
}

interface FavoritesState {
  movies: FavoriteMovie[];
  actors: FavoriteActor[];
}

/* ───────────────────── Storage + validation ─────────────────────
   อ่านจาก localStorage แล้ว "ตรวจรูปแบบ" ทุกครั้ง เพราะข้อมูลในเบราว์เซอร์แก้ได้เอง
   หรืออาจเป็นเวอร์ชันเก่า — ถ้าพัง จะไม่ทำให้หน้าเว็บ crash แค่เริ่มจากรายการว่าง */

const STORAGE_KEY = "hollywood-hub:favorites:v1";

const EMPTY: FavoritesState = { movies: [], actors: [] };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
const textOrNull = (v: unknown): string | null =>
  typeof v === "string" && v.length > 0 ? v : null;
const numberOrNull = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null;

function parseMovie(v: unknown): FavoriteMovie | null {
  if (!isRecord(v)) return null;
  if (typeof v.id !== "number" || !Number.isInteger(v.id) || v.id <= 0) return null;
  if (typeof v.title !== "string" || v.title.length === 0) return null;
  return {
    id: v.id,
    title: v.title,
    poster_url: textOrNull(v.poster_url),
    rating: numberOrNull(v.rating),
    year: numberOrNull(v.year),
  };
}

function parseActor(v: unknown): FavoriteActor | null {
  if (!isRecord(v)) return null;
  if (typeof v.id !== "number" || !Number.isInteger(v.id) || v.id <= 0) return null;
  if (typeof v.name !== "string" || v.name.length === 0) return null;
  return {
    id: v.id,
    name: v.name,
    avatar_url: textOrNull(v.avatar_url),
    nationality: textOrNull(v.nationality),
  };
}

function parseList<T extends { id: number }>(
  raw: unknown,
  parse: (v: unknown) => T | null,
): T[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<number>();
  const out: T[] = [];
  for (const item of raw) {
    const parsed = parse(item);
    if (parsed && !seen.has(parsed.id)) {
      seen.add(parsed.id);
      out.push(parsed);
    }
  }
  return out;
}

function readStorage(): FavoritesState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data)) return EMPTY;
    return {
      movies: parseList(data.movies, parseMovie),
      actors: parseList(data.actors, parseActor),
    };
  } catch {
    return EMPTY;
  }
}

/* ───────────────────── External store ─────────────────────
   เก็บ state ไว้ระดับ module แล้วให้ React อ่านผ่าน useSyncExternalStore
   → ทุก component (ปุ่มบนการ์ด, badge ใน Navbar, หน้า /watchlist) เห็นข้อมูลชุดเดียวกัน
   → ไม่เกิด hydration mismatch เพราะตอน SSR/hydrate ใช้ snapshot ว่าง (EMPTY) เสมอ
   → แท็บอื่นแก้รายการ จะซิงค์มาอัตโนมัติผ่าน "storage" event */

let cache: FavoritesState | null = null;
const listeners = new Set<() => void>();

function getSnapshot(): FavoritesState {
  if (cache === null) cache = readStorage();
  return cache;
}

function getServerSnapshot(): FavoritesState {
  return EMPTY;
}

function emit() {
  listeners.forEach((listener) => listener());
}

function commit(next: FavoritesState) {
  cache = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode / โควตาเต็ม: ยังใช้งานได้ในหน่วยความจำ แค่ไม่คงอยู่หลังรีเฟรช
  }
  emit();
}

function onStorage(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) return; // key === null คือ localStorage.clear()
  cache = null;
  emit();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) window.addEventListener("storage", onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", onStorage);
      cache = null; // ไม่มีใครฟังอยู่ → อ่านใหม่จาก storage ครั้งหน้า กันข้อมูลค้างเก่า
    }
  };
}

/** true หลัง hydrate เสร็จเท่านั้น (ฝั่งเซิร์ฟเวอร์และรอบ hydrate แรกเป็น false) */
const subscribeNoop = () => () => {};

/* ───────────────────────── Hook ───────────────────────── */

export function useFavorites() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);

  /** คืนค่า true ถ้าหลังสลับแล้ว "อยู่ในรายการโปรด" */
  const toggleMovie = useCallback((movie: FavoriteMovie): boolean => {
    const clean = parseMovie(movie); // ตัดฟิลด์แปลกปลอม (เช่น Decimal ของ Prisma) ก่อนบันทึก
    if (!clean) return false;
    const current = getSnapshot();
    const exists = current.movies.some((m) => m.id === clean.id);
    commit({
      ...current,
      movies: exists
        ? current.movies.filter((m) => m.id !== clean.id)
        : [clean, ...current.movies],
    });
    return !exists;
  }, []);

  const toggleActor = useCallback((actor: FavoriteActor): boolean => {
    const clean = parseActor(actor);
    if (!clean) return false;
    const current = getSnapshot();
    const exists = current.actors.some((a) => a.id === clean.id);
    commit({
      ...current,
      actors: exists
        ? current.actors.filter((a) => a.id !== clean.id)
        : [clean, ...current.actors],
    });
    return !exists;
  }, []);

  const removeMovie = useCallback((id: number) => {
    const current = getSnapshot();
    commit({ ...current, movies: current.movies.filter((m) => m.id !== id) });
  }, []);

  const removeActor = useCallback((id: number) => {
    const current = getSnapshot();
    commit({ ...current, actors: current.actors.filter((a) => a.id !== id) });
  }, []);

  const clearAll = useCallback(() => commit(EMPTY), []);

  const isMovieFavorite = useCallback(
    (id: number) => state.movies.some((m) => m.id === id),
    [state.movies],
  );
  const isActorFavorite = useCallback(
    (id: number) => state.actors.some((a) => a.id === id),
    [state.actors],
  );

  return useMemo(
    () => ({
      mounted,
      favoriteMovies: state.movies,
      favoriteActors: state.actors,
      totalCount: state.movies.length + state.actors.length,
      toggleMovie,
      toggleActor,
      isMovieFavorite,
      isActorFavorite,
      removeMovie,
      removeActor,
      clearAll,
    }),
    [
      mounted, state, toggleMovie, toggleActor,
      isMovieFavorite, isActorFavorite, removeMovie, removeActor, clearAll,
    ],
  );
}
