"use client";

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearWatchlist, setActorSaved, setMovieSaved } from "@/app/actions/watchlist";

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

/* ───────────────────── Context ─────────────────────
   รายการโปรดเก็บในฐานข้อมูลแยกตามบัญชี (ต้องล็อกอิน)
   - Root layout ดึงข้อมูลของผู้ใช้มาเป็นค่าเริ่มต้น → ปุ่ม/badge/หน้า /watchlist เห็นชุดเดียวกัน
   - กดบันทึกแล้ว UI เปลี่ยนทันที (optimistic) แล้วค่อยเรียก Server Action
     ถ้าล้มเหลวจะย้อนกลับ และถ้า session หมดอายุจะพาไปหน้าเข้าสู่ระบบ */

interface FavoritesContextValue {
  loggedIn: boolean;
  state: FavoritesState;
  setState: React.Dispatch<React.SetStateAction<FavoritesState>>;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function WatchlistProvider({
  loggedIn,
  initial,
  children,
}: {
  loggedIn: boolean;
  initial: FavoritesState;
  children: ReactNode;
}) {
  const [state, setState] = useState(initial);
  const value = useMemo(() => ({ loggedIn, state, setState }), [loggedIn, state]);
  return createElement(FavoritesContext.Provider, { value }, children);
}

/** เก็บเฉพาะฟิลด์ที่ต้องใช้ (ตัด Decimal ของ Prisma หรือฟิลด์อื่นที่ส่งมาเกิน) */
const pickMovie = (m: FavoriteMovie): FavoriteMovie => ({
  id: m.id,
  title: m.title,
  poster_url: m.poster_url,
  rating: m.rating,
  year: m.year,
});
const pickActor = (a: FavoriteActor): FavoriteActor => ({
  id: a.id,
  name: a.name,
  avatar_url: a.avatar_url,
  nationality: a.nationality,
});

/* ───────────────────────── Hook ───────────────────────── */

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error("useFavorites ต้องอยู่ภายใต้ <WatchlistProvider>");
  const { loggedIn, state, setState } = ctx;
  const router = useRouter();
  const pathname = usePathname();

  const goLogin = useCallback(() => {
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
  }, [router, pathname]);

  /** เรียก Server Action — ถ้าล้มเหลวให้ย้อน state กลับ */
  const sync = useCallback(
    async (action: () => Promise<{ error?: string; code?: string }>, rollback: () => void) => {
      try {
        const res = await action();
        if (res.error) {
          rollback();
          // ดูจากรหัส ไม่ใช่ข้อความ (ข้อความเปลี่ยนตามภาษา)
          if (res.code === "LOGIN_REQUIRED") goLogin();
          else console.error(res.error);
        }
      } catch (err) {
        rollback();
        console.error(err);
      }
    },
    [goLogin],
  );

  /** คืนค่า true ถ้าหลังสลับแล้ว "อยู่ในรายการโปรด" (ยังไม่ล็อกอิน → พาไปหน้า login และคืน false) */
  const toggleMovie = useCallback(
    (movie: FavoriteMovie): boolean => {
      if (!loggedIn) {
        goLogin();
        return false;
      }
      const clean = pickMovie(movie);
      const exists = state.movies.some((m) => m.id === clean.id);
      const add = () => setState((s) => ({ ...s, movies: [clean, ...s.movies.filter((m) => m.id !== clean.id)] }));
      const remove = () => setState((s) => ({ ...s, movies: s.movies.filter((m) => m.id !== clean.id) }));
      if (exists) remove();
      else add();
      void sync(() => setMovieSaved(clean.id, !exists), exists ? add : remove);
      return !exists;
    },
    [loggedIn, goLogin, state.movies, setState, sync],
  );

  const toggleActor = useCallback(
    (actor: FavoriteActor): boolean => {
      if (!loggedIn) {
        goLogin();
        return false;
      }
      const clean = pickActor(actor);
      const exists = state.actors.some((a) => a.id === clean.id);
      const add = () => setState((s) => ({ ...s, actors: [clean, ...s.actors.filter((a) => a.id !== clean.id)] }));
      const remove = () => setState((s) => ({ ...s, actors: s.actors.filter((a) => a.id !== clean.id) }));
      if (exists) remove();
      else add();
      void sync(() => setActorSaved(clean.id, !exists), exists ? add : remove);
      return !exists;
    },
    [loggedIn, goLogin, state.actors, setState, sync],
  );

  const removeMovie = useCallback(
    (id: number) => {
      const movie = state.movies.find((m) => m.id === id);
      if (movie) toggleMovie(movie);
    },
    [state.movies, toggleMovie],
  );

  const removeActor = useCallback(
    (id: number) => {
      const actor = state.actors.find((a) => a.id === id);
      if (actor) toggleActor(actor);
    },
    [state.actors, toggleActor],
  );

  const clearAll = useCallback(() => {
    const previous = state;
    setState({ movies: [], actors: [] });
    void sync(clearWatchlist, () => setState(previous));
  }, [state, setState, sync]);

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
      loggedIn,
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
      loggedIn, state, toggleMovie, toggleActor,
      isMovieFavorite, isActorFavorite, removeMovie, removeActor, clearAll,
    ],
  );
}
