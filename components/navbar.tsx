import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import NavbarShell from "@/components/navbar-shell";

/** อ่าน session แล้วตรวจซ้ำกับฐานข้อมูล (กรณี user ถูกลบ/เปลี่ยนสิทธิ์หลังออก cookie) */
async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.users.findUnique({
    where: { id: session.userId },
    select: { username: true, role: true },
  });
}

/**
 * overlay = ลอยทับ hero (โปร่งใสตอนอยู่บนสุด แล้วเปลี่ยนเป็นดำทึบ + blur เมื่อเลื่อนลง)
 * ไม่ใส่ = แถบดำทึบติดด้านบน (หน้าที่ไม่มี hero)
 */
export default async function Navbar({ overlay = false }: { overlay?: boolean }) {
  const user = await getCurrentUser();
  return (
    // Suspense: NavbarShell อ่าน query string (useSearchParams) เพื่อไฮไลต์เมนู
    <Suspense fallback={<div className={overlay ? "h-0" : "h-16"} aria-hidden />}>
      <NavbarShell user={user} overlay={overlay} />
    </Suspense>
  );
}
