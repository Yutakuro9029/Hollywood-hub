import { Loader2 } from "lucide-react";

export const cardClass =
  "relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-50/95 p-7 text-zinc-900 shadow-2xl shadow-black/50 sm:p-9 " +
  "dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:backdrop-blur-xl";

export const titleClass =
  "font-[family-name:var(--font-serif-th)] text-3xl font-bold text-amber-700 " +
  "dark:bg-gradient-to-r dark:from-amber-200 dark:via-amber-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent";

export const fieldClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white pr-4 pl-11 text-[15px] text-zinc-900 shadow-sm " +
  "placeholder:text-zinc-400 transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-none " +
  "dark:border-white/10 dark:bg-zinc-950/60 dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-amber-400";

export const iconClass =
  "pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-amber-500";

/** ปุ่มส้มทองมีพื้นผิว ใช้ร่วมกับหน้า auth */
export function AuthSubmitButton({
  pending,
  label,
  pendingLabel,
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-[15px] font-semibold tracking-wide text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(120,53,15,0.35),0_10px_24px_-8px_rgba(245,158,11,0.65)] transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-amber-500/40 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.10)_0_2px,transparent_2px_5px)] mix-blend-overlay"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-sm transition-transform duration-700 group-hover:translate-x-[420%]"
      />
      <span className="relative flex items-center gap-2">
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        {pending ? pendingLabel : label}
      </span>
    </button>
  );
}
