// ไม่มี import จาก next/headers และ server-only เพื่อให้ใช้ใน proxy/middleware ได้
import { SignJWT, jwtVerify } from "jose";

export type Role = "ADMIN" | "USER";

export interface SessionPayload {
  userId: number;
  username: string;
  role: Role;
}

export const SESSION_COOKIE = "hollywood_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // ติ๊ก "จดจำฉัน": 7 วัน (วินาที)
export const SESSION_SHORT_AGE = 60 * 60 * 24; // ไม่ติ๊ก: JWT หมดอายุใน 1 วัน และ cookie หายเมื่อปิดเบราว์เซอร์

function getSecretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ต้องตั้งค่าใน .env และยาวอย่างน้อย 32 ตัวอักษร");
  }
  return new TextEncoder().encode(secret);
}

function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "USER";
}

export async function signSessionToken(
  payload: SessionPayload,
  maxAgeSeconds: number = SESSION_MAX_AGE,
): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecretKey());
}

/** คืน null ถ้า token ถูกแก้ไข/หมดอายุ/รูปแบบไม่ถูกต้อง */
export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    if (
      typeof payload.userId !== "number" ||
      typeof payload.username !== "string" ||
      !isRole(payload.role)
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}
