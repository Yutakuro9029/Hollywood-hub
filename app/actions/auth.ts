"use server";

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession, type SessionPayload } from "@/lib/session";
import { FieldError, reqText, toErrorState } from "@/lib/form";

export interface LoginState {
  error?: string;
  username?: string;
  remember?: boolean;
}

export interface RegisterState {
  error?: string;
  /** คืนค่าที่กรอกไว้ (ยกเว้นรหัสผ่าน) เพื่อไม่ให้ฟอร์มถูกล้างเมื่อเกิด error */
  values?: { username: string; email: string };
}

// hash ปลอมไว้เทียบเมื่อไม่พบ username เพื่อให้เวลาตอบสนองใกล้เคียงกัน (กัน user enumeration)
const DUMMY_HASH =
  "$2b$10$9d2dBJXnv9gb3gEUgQP2oOSgG3A4KjoDmiVcWewgN9QsgSanOD8HK";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!username || !password) {
    return { error: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน", username, remember };
  }

  const user = await prisma.users.findUnique({
    where: { username },
    select: { id: true, username: true, password_hash: true, role: true },
  });

  const isValid = await bcrypt.compare(
    password,
    user?.password_hash ?? DUMMY_HASH,
  );

  if (!user || !isValid) {
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง", username, remember };
  }

  await createSession(
    {
      userId: user.id,
      username: user.username,
      role: user.role, // "ADMIN" | "USER"
    },
    remember,
  );

  // redirect() ต้องเรียกนอก try/catch
  redirect(user.role === "ADMIN" ? "/admin" : "/");
}

export async function register(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const values = {
    username: String(formData.get("username") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
  };
  const password = String(formData.get("password") ?? ""); // ห้าม trim รหัสผ่าน
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  let session: SessionPayload;
  try {
    const username = reqText(formData, "username", "ชื่อผู้ใช้", 50);
    if (username.length < 3 || /\s/.test(username)) {
      throw new FieldError("ชื่อผู้ใช้ต้องมีอย่างน้อย 3 ตัวอักษรและห้ามมีช่องว่าง");
    }

    const email = reqText(formData, "email", "อีเมล", 120).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new FieldError("รูปแบบอีเมลไม่ถูกต้อง");

    if (!password) throw new FieldError("กรุณากรอกรหัสผ่าน");
    if (password.length < 6) {
      throw new FieldError("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
    }
    // bcrypt ใช้ได้แค่ 72 ไบต์แรก (ภาษาไทย 1 ตัว = 3 ไบต์)
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new FieldError("รหัสผ่านยาวเกินไป (ไม่เกิน 72 ไบต์)");
    }
    if (password !== confirmPassword) {
      throw new FieldError("รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน");
    }

    const existing = await prisma.users.findFirst({
      where: { OR: [{ username }, { email }] },
      select: { username: true },
    });
    if (existing) {
      throw new FieldError(
        existing.username.toLowerCase() === username.toLowerCase()
          ? "ชื่อผู้ใช้นี้ถูกใช้แล้ว"
          : "อีเมลนี้ถูกใช้แล้ว",
      );
    }

    const password_hash = await bcrypt.hash(password, 10);
    const user = await prisma.users.create({
      // role กำหนดฝั่งเซิร์ฟเวอร์เสมอ ห้ามรับจากฟอร์ม
      data: { username, email, password_hash, role: "USER" },
      select: { id: true, username: true, role: true },
    });

    session = { userId: user.id, username: user.username, role: user.role };
  } catch (e) {
    // สมัครพร้อมกัน 2 คำขอ: unique constraint ใน DB ชนกัน
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { error: "ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้แล้ว", values };
    }
    return { error: toErrorState(e).error, values };
  }

  // createSession / redirect ต้องอยู่นอก try/catch (redirect() ใช้การ throw)
  await createSession(session);
  redirect("/");
}

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
