"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createSession, deleteSession } from "@/lib/session";

export interface LoginState {
  error?: string;
  username?: string;
  remember?: boolean;
}

// hash ปลอมไว้เทียบเมื่อไม่พบ username เพื่อให้เวลาตอบสนองใกล้เคียงกัน (กัน user enumeration)
const DUMMY_HASH =
  "$2b$10$9d2dBJXnv9gb3gEUgQP2oOSgG3A4KjoDmiVcWewgN9QsgSanOD8HK";

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

export async function logout(): Promise<void> {
  await deleteSession();
  redirect("/login");
}
