"use client";

import { useRef } from "react";
import { Bookmark } from "lucide-react";
import {
  useFavorites,
  type FavoriteActor,
  type FavoriteMovie,
} from "@/lib/use-favorites";
import { useI18n } from "@/lib/i18n/client";

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
  "inline-flex shrink-0 items-center justify-center transition-colors active:scale-95 motion-reduce:transition-none focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

const variantCls: Record<Variant, { on: string; off: string }> = {
  overlay: {
    on: "absolute right-2 top-2 z-10 h-8 w-8 rounded-[4px] bg-gold text-ink",
    off: "absolute right-2 top-2 z-10 h-8 w-8 rounded-[4px] bg-ink/70 text-cream backdrop-blur-sm hover:text-gold-light",
  },
  icon: {
    on: "h-9 w-9 rounded-[4px] border border-gold bg-gold/15 text-gold-light",
    off: "h-9 w-9 rounded-[4px] border border-line text-cream/80 hover:border-gold-dark hover:text-gold-light",
  },
  pill: {
    on: "gap-2 rounded-[4px] border border-gold bg-gold/15 px-5 py-2.5 text-sm font-medium text-gold-light",
    off: "gap-2 rounded-[4px] border border-gold/70 px-5 py-2.5 text-sm font-medium text-gold-light hover:border-gold hover:bg-gold/10",
  },
};

export default function FavoriteButton(props: Props) {
  const { variant = "icon", className = "" } = props;
  const { isMovieFavorite, isActorFavorite, toggleMovie, toggleActor } = useFavorites();
  const iconRef = useRef<HTMLSpanElement>(null);
  const { t } = useI18n();

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

  const label = saved ? t.favorite.inList : props.kind === "movie" ? t.favorite.addMovie : t.favorite.addActor;

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={t.favorite.aria(name)}
      title={saved ? t.favorite.removeTitle : t.favorite.addTitle}
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
