"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import { deleteMovie } from "@/app/actions/movies";
import Modal from "./modal";
import MovieForm, { type ActorOption, type MovieRow } from "./movie-form";
import { btnPrimary } from "./field";
import { tmdbImage } from "@/lib/tmdb-image";
import { alertError, alertSuccess, confirmAction } from "@/lib/swal";
import { useI18n } from "@/lib/i18n/client";

export default function MoviesTable({
  movies, actors, total, page, totalPages,
}: { movies: MovieRow[]; actors: ActorOption[]; total: number; page: number; totalPages: number }) {
  const [editing, setEditing] = useState<MovieRow | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();
  const c = t.admin.crud;

  async function onDelete(m: MovieRow) {
    const ok = await confirmAction({
      title: c.confirmDelete(m.title),
      text: m.cast.length > 0 ? c.deleteMovieText(m.cast.length) : c.deleteIrreversible,
      confirmText: c.deleteMovie,
      cancelText: c.cancel,
      danger: true,
    });
    if (!ok) return;
    setError(undefined);
    startTransition(async () => {
      const res = await deleteMovie(m.id);
      if (res.error) {
        setError(res.error);
        alertError(res.error, { title: c.failed, ok: c.ok });
      } else {
        alertSuccess(c.movieDeleted, m.title);
      }
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.manageMovies}</h1>
          <p className="text-sm text-zinc-500">
            {c.total(total, c.unitFilms)}{totalPages > 1 && ` · ${t.common.pageOf(page, totalPages)}`}
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          disabled={actors.length === 0}
          title={actors.length === 0 ? c.needActorFirst : undefined}
          className={btnPrimary}
        >
          <Plus size={16} /> {c.addMovie}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-surface">
            <tr>
              <th className="px-4 py-3">{c.colMovie}</th>
              <th className="px-4 py-3">{c.colCast}</th>
              <th className="px-4 py-3">{c.colYear}</th>
              <th className="px-4 py-3 text-right">{c.colBox}</th>
              <th className="px-4 py-3 text-right">{c.colRating}</th>
              <th className="px-4 py-3 text-right">{c.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {movies.map((m) => (
              <tr key={m.id} className="hover:bg-zinc-50 dark:hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {m.posterUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tmdbImage(m.posterUrl, "w92") ?? m.posterUrl} alt={m.title} className="h-14 w-10 rounded object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{m.title}</p>
                      <p className="text-xs text-zinc-500">{m.genre ?? "-"}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {m.cast.length === 0 ? "-" : (
                    <ul className="space-y-0.5">
                      {m.cast.slice(0, 3).map((c) => (
                        <li key={c.actorId}>
                          <span className="text-amber-400">{c.actorName}</span>
                          {c.roleName && <span className="text-xs text-zinc-500"> · {c.roleName}</span>}
                        </li>
                      ))}
                      {m.cast.length > 3 && <li className="text-xs text-zinc-500">{c.moreCast(m.cast.length - 3)}</li>}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3">{m.releaseYear ?? "-"}</td>
                <td className="px-4 py-3 text-right tabular-nums">
                  {m.boxOfficeMil === null
                    ? <span className="text-zinc-500">{c.unknown}</span>
                    : m.boxOfficeMil.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                    <button onClick={() => setEditing(m)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400" aria-label={c.edit}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(m)} disabled={pending} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50" aria-label={c.delete}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">{c.noMovies}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? c.newMovie : c.editMovie} onClose={() => setEditing(null)}>
          <MovieForm movie={editing === "new" ? null : editing} actors={actors} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
