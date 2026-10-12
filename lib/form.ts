import { Prisma } from "@prisma/client";
import type { Dict } from "@/lib/i18n/dictionaries";

export interface ActionState {
  error?: string;
  /** รหัส error ที่โค้ดฝั่ง client ใช้ตัดสินใจ (ข้อความ error เปลี่ยนตามภาษา จึงห้ามเทียบข้อความ) */
  code?: "LOGIN_REQUIRED";
  success?: boolean;
}

/** error ที่แสดงให้ผู้ใช้เห็นได้ (validation) */
export class FieldError extends Error {}

/**
 * ตัวตรวจค่าจากฟอร์ม พร้อมข้อความ error ตามภาษาที่ผู้ใช้เลือก
 * ใช้ใน Server Action: `const v = validators(t.form)` แล้วเรียก v.reqText(...) ฯลฯ
 */
export function validators(m: Dict["form"]) {
  function reqText(fd: FormData, key: string, label: string, max: number): string {
    const v = String(fd.get(key) ?? "").trim();
    if (!v) throw new FieldError(m.required(label));
    if (v.length > max) throw new FieldError(m.tooLong(label, max));
    return v;
  }

  function optText(fd: FormData, key: string, label: string, max: number): string | null {
    const v = String(fd.get(key) ?? "").trim();
    if (!v) return null;
    if (v.length > max) throw new FieldError(m.tooLong(label, max));
    return v;
  }

  function optUrl(fd: FormData, key: string, label: string): string | null {
    const v = optText(fd, key, label, 500);
    if (v === null) return null;
    try {
      const { protocol } = new URL(v);
      if (protocol !== "http:" && protocol !== "https:") throw new Error();
    } catch {
      throw new FieldError(m.badUrl(label));
    }
    return v;
  }

  function parseId(value: unknown, label = m.labels.id): number {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) throw new FieldError(m.invalid(label));
    return n;
  }

  function reqInt(fd: FormData, key: string, label: string, min: number, max: number): number {
    const raw = String(fd.get(key) ?? "").trim();
    if (!raw) throw new FieldError(m.required(label));
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) throw new FieldError(m.intRange(label, min, max));
    return n;
  }

  function optInt(fd: FormData, key: string, label: string, min: number, max: number): number | null {
    return String(fd.get(key) ?? "").trim() ? reqInt(fd, key, label, min, max) : null;
  }

  function optDecimal(fd: FormData, key: string, label: string, min: number, max: number, digits: number): number | null {
    const raw = String(fd.get(key) ?? "").trim();
    if (!raw) return null;
    const n = Number(raw);
    if (!Number.isFinite(n) || n < min || n > max) throw new FieldError(m.range(label, min, max));
    return Number(n.toFixed(digits));
  }

  function optDate(fd: FormData, key: string, label: string): Date | null {
    const raw = String(fd.get(key) ?? "").trim();
    if (!raw) return null;
    const date = new Date(`${raw}T00:00:00.000Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime())) throw new FieldError(m.invalid(label));
    return date;
  }

  /** แปลง error เป็น state ที่แสดงใน UI ได้ (ไม่หลุดรายละเอียดภายในไปให้ผู้ใช้) */
  function toErrorState(e: unknown): ActionState {
    if (e instanceof FieldError) return { error: e.message };
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      if (e.code === "P2003") return { error: m.actorMissing };
      if (e.code === "P2025") return { error: m.recordMissing };
    }
    console.error(e);
    return { error: m.generic };
  }

  return { reqText, optText, optUrl, parseId, reqInt, optInt, optDecimal, optDate, toErrorState };
}

export type Validators = ReturnType<typeof validators>;
