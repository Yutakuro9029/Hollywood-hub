"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { deleteActor } from "@/app/actions/actors";
import Modal from "./modal";
import ActorForm, { type ActorRow } from "./actor-form";
import { btnPrimary } from "./field";

export default function ActorsTable({ actors }: { actors: ActorRow[] }) {
  // null = ปิด, "new" = เพิ่มใหม่, ActorRow = แก้ไข
  const [editing, setEditing] = useState<ActorRow | "new" | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function onDelete(a: ActorRow) {
    const extra = a.movieCount > 0 ? `\nภาพยนตร์ของดาราคนนี้ ${a.movieCount} เรื่องจะถูกลบไปด้วย` : "";
    if (!confirm(`ลบ "${a.name}" ใช่หรือไม่?${extra}`)) return;
    setError(undefined);
    startTransition(async () => {
      const res = await deleteActor(a.id);
      if (res.error) setError(res.error);
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">จัดการดารา</h1>
          <p className="text-sm text-zinc-500">ทั้งหมด {actors.length} คน</p>
        </div>
        <button onClick={() => setEditing("new")} className={btnPrimary}>
          <Plus size={16} /> เพิ่มดารา
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-zinc-100 text-xs uppercase text-zinc-500 dark:bg-slate-900">
            <tr>
              <th className="px-4 py-3">ดารา</th>
              <th className="px-4 py-3">สัญชาติ</th>
              <th className="px-4 py-3">วันเกิด</th>
              <th className="px-4 py-3 text-right">รางวัล</th>
              <th className="px-4 py-3 text-right">หนัง</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {actors.map((a) => (
              <tr key={a.id} className="hover:bg-zinc-50 dark:hover:bg-slate-900/60">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}`}
                      alt={a.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                    <span className="font-medium">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{a.nationality ?? "-"}</td>
                <td className="px-4 py-3">{a.birthDate ?? "-"}</td>
                <td className="px-4 py-3 text-right text-amber-400">{a.awardsCount}</td>
                <td className="px-4 py-3 text-right">{a.movieCount}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => setEditing(a)} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-amber-400" aria-label="แก้ไข">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => onDelete(a)} disabled={pending} className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-red-400 disabled:opacity-50" aria-label="ลบ">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {actors.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-zinc-500">ยังไม่มีข้อมูลดารา</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <Modal title={editing === "new" ? "เพิ่มดาราใหม่" : "แก้ไขข้อมูลดารา"} onClose={() => setEditing(null)}>
          <ActorForm actor={editing === "new" ? null : editing} onDone={() => setEditing(null)} />
        </Modal>
      )}
    </>
  );
}
