"use client";

import { useActionState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { createActor, updateActor } from "@/app/actions/actors";
import type { ActionState } from "@/lib/form";
import { Field, btnGhost, btnPrimary, inputCls } from "./field";

export interface ActorRow {
  id: number;
  name: string;
  nationality: string | null;
  birthDate: string | null; // YYYY-MM-DD
  bio: string | null;
  avatarUrl: string | null;
  awardsCount: number;
  movieCount: number;
}

export default function ActorForm({
  actor, onDone,
}: { actor: ActorRow | null; onDone: () => void }) {
  const action = actor ? updateActor.bind(null, actor.id) : createActor;
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

      <Field label="ชื่อดารา" required>
        <input name="name" defaultValue={actor?.name} maxLength={120} required className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="สัญชาติ">
          <input name="nationality" defaultValue={actor?.nationality ?? ""} maxLength={60} className={inputCls} />
        </Field>
        <Field label="วันเกิด">
          <input type="date" name="birth_date" defaultValue={actor?.birthDate ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label="จำนวนรางวัล">
        <input type="number" min={0} name="awards_count" defaultValue={actor?.awardsCount ?? 0} className={inputCls} />
      </Field>

      <Field label="URL รูปโปรไฟล์">
        <input type="url" name="avatar_url" defaultValue={actor?.avatarUrl ?? ""} placeholder="https://..." className={inputCls} />
      </Field>

      <Field label="ประวัติ">
        <textarea name="bio" rows={4} defaultValue={actor?.bio ?? ""} className={inputCls} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>ยกเลิก</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {actor ? "บันทึกการแก้ไข" : "เพิ่มดารา"}
        </button>
      </div>
    </form>
  );
}
