"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteActor } from "@/app/actions/actors";
import Modal from "./modal";
import ActorForm, { type ActorRow } from "./actor-form";
import { btnPrimary } from "./field";
import { tmdbImage } from "@/lib/tmdb-image";
import { alertError, alertSuccess, confirmAction } from "@/lib/swal";
import { useI18n } from "@/lib/i18n/client";

export default function ActorsTable({
  actors, total, page, totalPages,
}: { actors: ActorRow[]; total: number; page: number; totalPages: number }) {
  // null = ปิด, "new" = เพิ่มใหม่, ActorRow = แก้ไข
  const [editing, setEditing] = useState<ActorRow | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const { t } = useI18n();
  const c = t.admin.crud;

  async function onDelete(a: ActorRow) {
    const ok = await confirmAction({
      title: c.confirmDelete(a.name),
      text: a.movieCount > 0 ? c.deleteActorText(a.movieCount) : c.deleteIrreversible,
      confirmText: c.deleteActor,
      cancelText: c.cancel,
      danger: true,
    });
    if (!ok) return;
    setError(undefined);
    startTransition(async () => {
      const res = await deleteActor(a.id);
      if (res.error) {
        setError(res.error);
        alertError(res.error, { title: c.failed, ok: c.ok });
      } else {
        alertSuccess(c.actorDeleted, a.name);
      }
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{t.admin.manageActors}</h1>
          <p className="text-sm text-zinc-500">
            {c.total(total, c.unitPeople)}{totalPages > 1 && ` · ${t.common.pageOf(page, totalPages)}`}
          </p>
        </div>
        <button onClick={() => setEditing("new")} className={btnPrimary}>
          <Plus size={16} /> {c.addActor}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-surface">
            <tr>
              <th className="px-4 py-3">{c.colActor}</th>
              <th className="px-4 py-3">{c.colNationality}</th>
              <th className="px-4 py-3">{c.colBirth}</th>
              <th className="px-4 py-3 text-right">{c.colAwards}</th>
              <th className="px-4 py-3 text-right">{c.colMovies}</th>
              <th className="px-4 py-3 text-right">{c.colActions}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {actors.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-surface/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={tmdbImage(a.avatarUrl, "w92") ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}`}
                      alt={a.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{a.nationality ?? "-"}</td>
                <td className="px-4 py-3">{a.birthDate ?? "-"}</td>
                <td className="px-4 py-3 text-right text-amber-400">{a.awardsCount ?? <span className="text-zinc-500">-</span>}</td>
                <td className="px-4 py-3 text-right">{a.movieCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(a)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400" aria-label={c.edit}>
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(a)} disabled={pending} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50" aria-label={c.delete}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {actors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">{c.noActors}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? c.newActor : c.editActor} onClose={() => setEditing(null)}>
          <ActorForm actor={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
