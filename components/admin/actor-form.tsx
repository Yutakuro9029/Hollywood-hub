"use client";

import { startTransition, useActionState, useEffect, useRef, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { createActor, updateActor } from "@/app/actions/actors";
import type { ActionState } from "@/lib/form";
import { alertError, alertSuccess, confirmAction } from "@/lib/swal";
import { useI18n } from "@/lib/i18n/client";
import { Field, btnGhost, btnPrimary, inputCls } from "./field";

export interface ActorRow {
  id: number;
  name: string;
  nationality: string | null;
  birthDate: string | null; // YYYY-MM-DD
  bio: string | null;
  avatarUrl: string | null;
  /** null = ไม่มีข้อมูลรางวัล */
  awardsCount: number | null;
  movieCount: number;
}

export default function ActorForm({
  actor, onDone,
}: { actor: ActorRow | null; onDone: () => void }) {
  const action = actor ? updateActor.bind(null, actor.id) : createActor;
  const [state, formAction, pending] = useActionState(action, {} as ActionState);
  const { t } = useI18n();
  const c = t.admin.crud;

  // ผลจากเซิร์ฟเวอร์: สำเร็จ → แจ้งแล้วปิดฟอร์ม, ผิดพลาด → แจ้งเตือน (ข้อความยังแสดงในฟอร์มด้วย)
  // จำผลที่แจ้งไปแล้ว กันแจ้งซ้ำเมื่อ component render ใหม่ (onDone เป็นฟังก์ชันใหม่ทุกครั้ง)
  const handled = useRef(state);
  useEffect(() => {
    if (state === handled.current) return;
    handled.current = state;
    if (state.success) {
      onDone();
      alertSuccess(actor ? c.saved : c.actorAdded);
    } else if (state.error) {
      alertError(state.error, { title: c.failed, ok: c.ok });
    }
  }, [state, onDone, actor, c]);

  /** ถามยืนยันก่อนส่ง (เบราว์เซอร์ตรวจช่องบังคับกรอกให้ก่อนถึงตรงนี้แล้ว) */
  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") ?? "").trim();
    const ok = await confirmAction(
      actor
        ? { title: c.confirmEdit, text: c.confirmEditText(name), confirmText: c.save, cancelText: c.cancel }
        : { title: c.confirmAddActor, text: c.confirmAddText(name), confirmText: c.addActor, cancelText: c.cancel },
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

      <Field label={c.fields.actorName} required>
        <input name="name" defaultValue={actor?.name} maxLength={120} required className={inputCls} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={c.fields.nationality}>
          <input name="nationality" defaultValue={actor?.nationality ?? ""} maxLength={60} className={inputCls} />
        </Field>
        <Field label={c.fields.birthDate}>
          <input type="date" name="birth_date" defaultValue={actor?.birthDate ?? ""} className={inputCls} />
        </Field>
      </div>

      <Field label={c.fields.awards}>
        <input type="number" min={0} name="awards_count" defaultValue={actor?.awardsCount ?? ""} placeholder={c.fields.awardsPlaceholder} className={inputCls} />
      </Field>

      <Field label={c.fields.avatar}>
        <input type="url" name="avatar_url" defaultValue={actor?.avatarUrl ?? ""} placeholder="https://..." className={inputCls} />
      </Field>

      <Field label={c.fields.bio}>
        <textarea name="bio" rows={4} defaultValue={actor?.bio ?? ""} className={inputCls} />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onDone} className={btnGhost}>{c.cancel}</button>
        <button type="submit" disabled={pending} className={btnPrimary}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {actor ? c.saveChanges : c.addActor}
        </button>
      </div>
    </form>
  );
}
