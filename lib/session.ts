import "server-only";
import { cookies } from "next/headers";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  SESSION_SHORT_AGE,
  signSessionToken,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/auth-token";

export type { Role, SessionPayload } from "@/lib/auth-token";

/**
 * สร้าง JWT (ลงลายเซ็น) แล้วเก็บลง HttpOnly Cookie
 * remember = true  → cookie อยู่ 7 วัน
 * remember = false → session cookie (หายเมื่อปิดเบราว์เซอร์) และ JWT หมดอายุใน 1 วัน
 */
export async function createSession(
  payload: SessionPayload,
  remember = false,
): Promise<void> {
  const token = await signSessionToken(
    payload,
    remember ? SESSION_MAX_AGE : SESSION_SHORT_AGE,
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    ...(remember ? { maxAge: SESSION_MAX_AGE } : {}),
  });
}

/** อ่านและตรวจสอบ session จาก Cookie — คืน null ถ้าไม่มี/ถูกแก้ไข/หมดอายุ */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySessionToken(token) : null;
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
