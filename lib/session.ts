import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export type Role = "ADMIN" | "USER";

export interface SessionPayload {
  userId: number;
  username: string;
  role: Role;
}

export const SESSION_COOKIE = "hollywood_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 วัน (วินาที)

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

/** สร้าง JWT (ลงลายเซ็น) แล้วเก็บลง HttpOnly Cookie */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

/** อ่านและตรวจสอบ session จาก Cookie — คืน null ถ้าไม่มี/ถูกแก้ไข/หมดอายุ */
export async function getSession(): Promise<SessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

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

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
