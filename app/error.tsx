"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCcw, TriangleAlert } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.10),transparent_60%)]" />

      <div className="relative w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10">
          <TriangleAlert size={36} className="text-red-400" />
        </div>

        <h1 className="text-2xl font-bold">เกิดข้อผิดพลาดบางอย่าง</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          กรุณาลองใหม่อีกครั้ง หากยังพบปัญหาให้ติดต่อผู้ดูแลระบบ
        </p>

        {error.digest && (
          <p className="mt-3 font-mono text-xs text-zinc-400 dark:text-zinc-500">
            รหัสอ้างอิง: {error.digest}
          </p>
        )}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-amber-300"
          >
            <RotateCcw size={16} /> ลองอีกครั้ง
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-5 py-2.5 text-sm text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <Home size={16} /> กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </main>
  );
}
