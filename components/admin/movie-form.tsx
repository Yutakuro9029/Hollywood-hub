"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createMovie, updateMovie } from "@/app/actions/movies";
import type { ActionState } from "@/lib/form";
import { Field, btnGhost, btnPrimary, inputCls } from "./field";

export interface MovieRow {
  id: number;
  actorId: number;
  actorName: string;
  title: string;
  releaseYear: number | null;
  genre: string | null;
  roleName: string | null;
  boxOfficeMil: number;
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

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {state.error}
        </p>
      )}

      <Field label="ดารา (เจ้าของเรื่อง)" required>
        <select name="actor_id" defaultValue={movie?.actorId ?? ""} required className={inputCls}>
          <option value="" disabled>-- เลือกดารา --</option>
          {actors.map((a) => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
      </Field>

      <Field label="ชื่อภาพยนตร์" required>
        <input name="title" defaultValue={movie?.title} maxLength={200} required className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ปีที่ฉาย">
          <input type="number" name="release_year" min={1888} max={2100} defaultValue={movie?.releaseYear ?? ""} className={inputCls} />
        </Field>
        <Field label="ชื่อบทบาท">
          <input name="role_name" defaultValue={movie?.roleName ?? ""} maxLength={120} className={inputCls} />
        </Field>
      </div>

      <Field label="ประเภท (คั่นด้วย , )">
        <input name="genre" defaultValue={movie?.genre ?? ""} maxLength={100} placeholder="Action, Sci-Fi" className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="รายได้ทั่วโลก (ล้านดอลลาร์)">
          <input type="number" name="box_office_mil" min={0} step="0.01" defaultValue={movie?.boxOfficeMil ?? 0} className={inputCls} />
        </Field>
        <Field label="คะแนน (0 - 10)">
          <input type="number" name="rating" min={0} max={10} step="0.1" defaultValue={movie?.rating ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label="URL โปสเตอร์">
        <input type="url" name="poster_url" defaultValue={movie?.posterUrl ?? ""} placeholder="https://..." className={inputCls} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>ยกเลิก</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {movie ? "บันทึกการแก้ไข" : "เพิ่มภาพยนตร์"}
        </button>
      </div>
    </form>
  );
}
