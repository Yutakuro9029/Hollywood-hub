import { Prisma } from "@prisma/client";

export interface ActionState {
  error?: string;
  success?: boolean;
}

/** error ที่แสดงให้ผู้ใช้เห็นได้ (validation) */
export class FieldError extends Error {}

export function reqText(fd: FormData, key: string, label: string, max: number): string {
  const v = String(fd.get(key) ?? "").trim();
  if (!v) throw new FieldError(`กรุณากรอก${label}`);
  if (v.length > max) throw new FieldError(`${label}ต้องไม่เกิน ${max} ตัวอักษร`);
  return v;
}

export function optText(fd: FormData, key: string, label: string, max: number): string | null {
  const v = String(fd.get(key) ?? "").trim();
  if (!v) return null;
  if (v.length > max) throw new FieldError(`${label}ต้องไม่เกิน ${max} ตัวอักษร`);
  return v;
}

export function optUrl(fd: FormData, key: string, label: string): string | null {
  const v = optText(fd, key, label, 500);
  if (v === null) return null;
  try {
    const { protocol } = new URL(v);
    if (protocol !== "http:" && protocol !== "https:") throw new Error();
  } catch {
    throw new FieldError(`${label}ต้องเป็น URL ที่ขึ้นต้นด้วย http:// หรือ https://`);
  }
  return v;
}

export function parseId(value: unknown, label = "รหัส"): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new FieldError(`${label}ไม่ถูกต้อง`);
  return n;
}

export function reqInt(
  fd: FormData, key: string, label: string, min: number, max: number,
): number {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) throw new FieldError(`กรุณากรอก${label}`);
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min || n > max) {
    throw new FieldError(`${label}ต้องเป็นจำนวนเต็มระหว่าง ${min} ถึง ${max}`);
  }
  return n;
}

export function optInt(
  fd: FormData, key: string, label: string, min: number, max: number,
): number | null {
  return String(fd.get(key) ?? "").trim() ? reqInt(fd, key, label, min, max) : null;
}

export function optDecimal(
  fd: FormData, key: string, label: string, min: number, max: number, digits: number,
): number | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < min || n > max) {
    throw new FieldError(`${label}ต้องอยู่ระหว่าง ${min} ถึง ${max}`);
  }
  return Number(n.toFixed(digits));
}

export function optDate(fd: FormData, key: string, label: string): Date | null {
  const raw = String(fd.get(key) ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw) || Number.isNaN(date.getTime())) {
    throw new FieldError(`${label}ไม่ถูกต้อง`);
  }
  return date;
}

/** แปลง error เป็น state ที่แสดงใน UI ได้ (ไม่หลุดรายละเอียดภายในไปให้ผู้ใช้) */
export function toErrorState(e: unknown): ActionState {
  if (e instanceof FieldError) return { error: e.message };
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2003") return { error: "ไม่พบดาราที่เลือก" };
    if (e.code === "P2025") return { error: "ไม่พบข้อมูลที่ต้องการ (อาจถูกลบไปแล้ว)" };
  }
  console.error(e);
  return { error: "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง" };
}
