import Link from "next/link";
import { Film, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(251,191,36,0.12),transparent_60%)]" />

      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-amber-400/40 bg-amber-400/10">
          <Film size={36} className="text-amber-400" />
        </div>

        <p className="text-7xl font-black tracking-widest text-amber-400">
          404
        </p>
        <h1 className="mt-4 text-2xl font-bold">ไม่พบหน้าที่คุณต้องการ</h1>

        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300"
        >
          <Home size={16} /> กลับหน้าหลัก
        </Link>
      </div>
    </main>
  );
}
