"use client";

import { startTransition, useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { createMovie, updateMovie } from "@/app/actions/movies";
import type { ActionState } from "@/lib/form";
import { alertError, alertSuccess, confirmAction } from "@/lib/swal";
import { useI18n } from "@/lib/i18n/client";
import { Field, btnGhost, btnPrimary, inputCls } from "./field";

export interface CastRow {
  actorId: number;
  actorName: string;
  roleName: string | null;
}

export interface MovieRow {
  id: number;
  /** เรียงตามลำดับเครดิต (คนแรก = นักแสดงนำ) */
  cast: CastRow[];
  title: string;
  releaseYear: number | null;
  genre: string | null;
  /** null = ไม่ทราบรายได้ */
  boxOfficeMil: number | null;
  rating: number | null;
  posterUrl: string | null;
}

export interface ActorOption {
  id: number;
  name: string;
}

export default function MovieForm({
  movie, actors, onDone,
}: { movie: MovieRow | null; actors: ActorOption[]; onDone: () => void }) {
  const action = movie ? updateMovie.bind(null, movie.id) : createMovie;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { t } = useI18n();
  const c = t.admin.crud;
  // key คงที่ต่อแถว เพื่อให้ React ไม่สลับค่า input เมื่อลบแถวกลางรายการ
  const [castRows, setCastRows] = useState(() =>
    (movie?.cast.length ? movie.cast : [{ actorId: 0, actorName: "", roleName: null }]).map(
      (c, i) => ({ key: i, actorId: c.actorId, roleName: c.roleName ?? "" }),
    ),
  );
  const [nextKey, setNextKey] = useState(castRows.length);

  function addCastRow() {
    setCastRows((rows) => [...rows, { key: nextKey, actorId: 0, roleName: "" }]);
    setNextKey((k) => k + 1);
  }

  // ผลจากเซิร์ฟเวอร์: สำเร็จ → แจ้งแล้วปิดฟอร์ม, ผิดพลาด → แจ้งเตือน (ข้อความยังแสดงในฟอร์มด้วย)
  // จำผลที่แจ้งไปแล้ว กันแจ้งซ้ำเมื่อ component render ใหม่ (onDone เป็นฟังก์ชันใหม่ทุกครั้ง)
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state.success) {
      onDone();
      alertSuccess(movie ? c.saved : c.movieAdded);
    } else if (state.error) {
      alertError(state.error, { title: c.failed, ok: c.ok });
    }
  }, [state, onDone, movie, c]);

  /** ถามยืนยันก่อนส่ง (เบราว์เซอร์ตรวจช่องบังคับกรอกให้ก่อนถึงตรงนี้แล้ว) */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const title = String(fd.get("title") ?? "").trim();
    const ok = await confirmAction(
      movie
        ? { title: c.confirmEdit, text: c.confirmEditText(title), confirmText: c.save, cancelText: c.cancel }
        : { title: c.confirmAddMovie, text: c.confirmAddText(title), confirmText: c.addMovie, cancelText: c.cancel },
    );
    if (ok) startTransition(() => formAction(fd));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Field label={c.fields.title} required>
        <input name="title" defaultValue={movie?.title} maxLength={200} required className={inputCls} />
      </Field>

      <Field label={c.fields.year}>
        <input type="number" name="release_year" min={1888} max={2100} defaultValue={movie?.releaseYear ?? ""} className={inputCls} />
      </Field>

      <fieldset className="space-y-2">
        <legend className="mb-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          {c.fields.cast} <span className="text-red-400">*</span>
        </legend>
        {castRows.map((row, i) => (
          <div key={row.key} className="flex gap-2">
            <select
              name="cast_actor_id"
              defaultValue={row.actorId || ""}
              required={i === 0}
              aria-label={c.fields.actorN(i + 1)}
              className={inputCls}
            >
              <option value="">{c.fields.pickActor}</option>
              {actors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            <input
              name="cast_role"
              defaultValue={row.roleName}
              maxLength={120}
              placeholder={c.fields.rolePlaceholder}
              aria-label={c.fields.roleN(i + 1)}
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setCastRows((rows) => rows.filter((r) => r.key !== row.key))}
              disabled={castRows.length === 1}
              className="shrink-0 rounded-lg p-2 text-zinc-400 hover:text-red-400 disabled:opacity-30"
              aria-label={c.fields.removeN(i + 1)}
            >
              <X size={16} />
            </button>
          </div>
        ))}
        <button type="button" onClick={addCastRow} className="inline-flex items-center gap-1 text-sm text-amber-500 hover:text-amber-400">
          <Plus size={14} /> {c.fields.addCast}
        </button>
      </fieldset>

      <Field label={c.fields.genre}>
        <input name="genre" defaultValue={movie?.genre ?? ""} maxLength={100} placeholder="Action, Sci-Fi" className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.fields.boxOffice}>
          <input type="number" name="box_office_mil" min={0} step="0.01" defaultValue={movie?.boxOfficeMil ?? ""} className={inputCls} />
        </Field>
        <Field label={c.fields.rating}>
          <input type="number" name="rating" min={0} max={10} step="0.1" defaultValue={movie?.rating ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label={c.fields.poster}>
        <input type="url" name="poster_url" defaultValue={movie?.posterUrl ?? ""} placeholder="https://..." className={inputCls} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>{c.cancel}</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {movie ? c.saveChanges : c.addMovie}
        </button>
      </div>
    </form>
  );
}
