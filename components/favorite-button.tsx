"use client";

import { useRef } from "react";
import { Bookmark } from "lucide-react";
import {
  useFavorites,
  type FavoriteActor,
  type FavoriteMovie,
} from "@/lib/use-favorites";

type Variant = "overlay" | "icon" | "pill";

type Props = (
  | { kind: "movie"; item: FavoriteMovie }
  | { kind: "actor"; item: FavoriteActor }
) & {
  /**
   * overlay = วงกลมลอยมุมขวาบนของโปสเตอร์ (ต้องให้ parent เป็น `relative`)
   * icon    = ปุ่มสี่เหลี่ยมมุมมนไอคอนอย่างเดียว วางข้างชื่อดารา/ชื่อหนัง
   * pill    = ปุ่มมีข้อความ ใช้ในหน้ารายละเอียด
   */
  variant?: Variant;
  className?: string;
};

const base =
  "inline-flex shrink-0 items-center justify-center transition-colors active:scale-95 disabled:cursor-wait disabled:opacity-60 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-slate-950";

const variantCls: Record<Variant, { on: string; off: string }> = {
  overlay: {
    on: "absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/30 ring-1 ring-amber-300",
    off: "absolute right-2 top-2 z-10 h-9 w-9 rounded-full bg-slate-950/65 text-zinc-100 ring-1 ring-white/20 backdrop-blur-md hover:bg-slate-950/85 hover:text-amber-300",
  },
  icon: {
    on: "h-9 w-9 rounded-lg border border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300",
    off: "h-9 w-9 rounded-lg border border-zinc-300 text-zinc-600 hover:border-amber-400 hover:text-amber-600 dark:border-zinc-700 dark:text-zinc-300 dark:hover:text-amber-300",
  },
  pill: {
    on: "gap-2 rounded-lg border border-amber-400 bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300",
    off: "gap-2 rounded-lg border border-amber-500/70 px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-400 hover:text-slate-950 dark:border-amber-400/60 dark:text-amber-300 dark:hover:text-slate-950",
  },
};

export default function FavoriteButton(props: Props) {
  const { variant = "icon", className = "" } = props;
  const { mounted, isMovieFavorite, isActorFavorite, toggleMovie, toggleActor } =
    useFavorites();
  const iconRef = useRef<HTMLSpanElement>(null);

  const saved =
    props.kind === "movie"
      ? isMovieFavorite(props.item.id)
      : isActorFavorite(props.item.id);
  const name = props.kind === "movie" ? props.item.title : props.item.name;

  /** เด้งไอคอนเบา ๆ ตอนบันทึก (ข้ามถ้าผู้ใช้ตั้งค่า reduced motion) */
  function pop() {
    const el = iconRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(
      [
        { transform: "scale(1) rotate(0deg)" },
        { transform: "scale(1.45) rotate(-10deg)", offset: 0.45 },
        { transform: "scale(1) rotate(0deg)" },
      ],
      { duration: 380, easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
    );
  }

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // เผื่อถูกวางไว้ในลิงก์/การ์ดที่คลิกได้ — ไม่ให้พาไปหน้าอื่น
    e.preventDefault();
    e.stopPropagation();
    const nowSaved =
      props.kind === "movie" ? toggleMovie(props.item) : toggleActor(props.item);
    if (nowSaved) pop();
  }

  const label = saved
    ? "บันทึกแล้ว"
    : props.kind === "movie"
      ? "บันทึกเรื่องนี้"
      : "บันทึกดารา";

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!mounted}
      aria-pressed={saved}
      aria-label={`บันทึก ${name} ไว้ในรายการโปรด`}
      title={saved ? "นำออกจากรายการโปรด" : "บันทึกไว้ในรายการโปรด"}
      className={`${base} ${saved ? variantCls[variant].on : variantCls[variant].off} ${className}`}
    >
      <span ref={iconRef} className="inline-flex">
        <Bookmark
          className="h-4 w-4"
          fill={saved ? "currentColor" : "none"}
          aria-hidden
        />
      </span>
      {variant === "pill" && <span>{label}</span>}
    </button>
  );
}
