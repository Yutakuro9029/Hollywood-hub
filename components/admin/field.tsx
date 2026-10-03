export const inputCls =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-amber-400 focus:ring-1 focus:ring-amber-400 dark:border-zinc-700 dark:bg-slate-950";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300 disabled:opacity-50";

export const btnGhost =
  "rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition hover:bg-zinc-800";

export function Field({
  label, required, className = "", children,
}: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
        {label} {required && <span className="text-red-400">*</span>}
      </span>
      {children}
    </label>
  );
}
