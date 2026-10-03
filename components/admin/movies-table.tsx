"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { deleteMovie } from "@/app/actions/movies";
import Modal from "./modal";
import MovieForm, { type ActorOption, type MovieRow } from "./movie-form";
import { btnPrimary } from "./field";

export default function MoviesTable({
  movies, actors,
}: { movies: MovieRow[]; actors: ActorOption[] }) {
  const [editing, setEditing] = useState<MovieRow | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onDelete(m: MovieRow) {
    if (!confirm(`ลบภาพยนตร์ "${m.title}" ใช่หรือไม่?`)) return;
    setError(undefined);
    startTransition(async () => {
      const res = await deleteMovie(m.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">จัดการภาพยนตร์</h1>
          <p className="text-sm text-zinc-500">ทั้งหมด {movies.length} เรื่อง</p>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={actors.length === 0}
          title={actors.length === 0 ? "ต้องเพิ่มดาราก่อน" : undefined}
          className={btnPrimary}
        >
          <Plus size={16} /> เพิ่มภาพยนตร์
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">ภาพยนตร์</th>
              <th className="px-4 py-3">ดารา</th>
              <th className="px-4 py-3">บทบาท</th>
              <th className="px-4 py-3">ปี</th>
              <th className="px-4 py-3 text-right">รายได้ (M$)</th>
              <th className="px-4 py-3 text-right">คะแนน</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {movies.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.posterUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.posterUrl} alt={m.title} className="h-14 w-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-xs text-zinc-500">{m.genre ?? "-"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-amber-400">{m.actorName}</td>
                <td className="px-4 py-3">{m.roleName ?? "-"}</td>
                <td className="px-4 py-3">{m.releaseYear ?? "-"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {m.boxOfficeMil.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right">
                  {m.rating !== null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star size={14} className="fill-amber-400 text-amber-400" /> {m.rating.toFixed(1)}
                    </span>
                  ) : "-"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(m)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400" aria-label="แก้ไข">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(m)} disabled={pending} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50" aria-label="ลบ">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-500">ยังไม่มีข้อมูลภาพยนตร์</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "เพิ่มภาพยนตร์ใหม่" : "แก้ไขภาพยนตร์"} onClose={() => setEditing(null)}>
          <MovieForm movie={editing === "new" ? null : editing} actors={actors} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
