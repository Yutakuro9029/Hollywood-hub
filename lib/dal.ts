import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession, type SessionPayload } from "@/lib/session";

/** ต้องล็อกอิน — ถ้าไม่มี session ส่งไป /login */
export const requireUser = cache(async (): Promise<SessionPayload> => {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
});

/**
 * ต้องเป็น ADMIN เท่านั้น
 * เช็กทั้ง role ใน session และตรวจซ้ำกับฐานข้อมูล เผื่อ user ถูกลบ/ลดสิทธิ์
 * หลังออก cookie ไปแล้ว (JWT ยังไม่หมดอายุ)
 */
export const requireAdmin = cache(async (): Promise<SessionPayload> => {
  const session = await requireUser();
  if (session.role !== "ADMIN") redirect("/");

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { role: true },
  });
  if (!user || user.role !== "ADMIN") redirect("/");

  return session;
});
