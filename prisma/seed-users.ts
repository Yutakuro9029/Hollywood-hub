/**
 * สร้างบัญชีทดสอบ (ใช้ในเครื่องพัฒนาเท่านั้น — ห้ามรันกับฐานข้อมูลจริง)
 *
 *   npm run seed:users
 *
 * รันซ้ำได้: ถ้ามีบัญชีอยู่แล้วจะรีเซ็ตรหัสผ่านและสิทธิ์ให้ตรงกับรายการด้านล่าง
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient, type users_role } from "@prisma/client";

const prisma = new PrismaClient();

// ตรงกับกล่อง "บัญชีทดสอบ" ในหน้าเข้าสู่ระบบ (components/login-form.tsx)
const TEST_USERS: { username: string; email: string; password: string; role: users_role }[] = [
  { username: "admin", email: "admin@example.test", password: "admin123", role: "ADMIN" },
  { username: "user1", email: "user1@example.test", password: "user123", role: "USER" },
];

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ห้ามสร้างบัญชีทดสอบใน production");
  }

  for (const u of TEST_USERS) {
    // เก็บเฉพาะ hash ของรหัสผ่าน (bcrypt, cost 10 เหมือนตอนสมัครผ่านเว็บ)
    const password_hash = await bcrypt.hash(u.password, 10);
    await prisma.users.upsert({
      where: { username: u.username },
      create: { username: u.username, email: u.email, password_hash, role: u.role },
      update: { password_hash, role: u.role },
    });
    console.log(`✔ ${u.role.padEnd(5)} ${u.username}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
