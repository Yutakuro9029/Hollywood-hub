import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Clapperboard, Star } from "lucide-react";
import { getSession } from "@/lib/session";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Hollywood Stars & Filmography Hub",
};

export default async function LoginPage() {
  // ถ้าล็อกอินอยู่แล้ว ไม่ต้องเห็นหน้า login
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* ฝั่งซ้าย: ภาพ/สโลแกน (ซ่อนบนมือถือ) */}
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-zinc-900 via-slate-950 to-black lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-amber-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-400/10 blur-3xl" />

        <div className="relative flex items-center gap-2 text-amber-400">
          <Clapperboard className="h-7 w-7" />
          <span className="text-lg font-bold tracking-wide">Hollywood Hub</span>
        </div>

        <div className="relative space-y-4">
          <div className="flex gap-1 text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-5 w-5 fill-current" />
            ))}
          </div>
          <h2 className="text-4xl leading-tight font-extrabold text-white">
            ศูนย์รวมข้อมูล
            <br />
            <span className="text-amber-400">ดาราและภาพยนตร์ฮอลลีวูด</span>
          </h2>
          <p className="max-w-md text-zinc-400">
            ค้นหาดาราที่คุณชื่นชอบ สำรวจผลงานภาพยนตร์ และติดตามรางวัลระดับโลก
            ได้ในที่เดียว
          </p>
        </div>

        <p className="relative text-sm text-zinc-500">
          © {new Date().getFullYear()} Hollywood Stars &amp; Filmography Hub
        </p>
      </section>

      {/* ฝั่งขวา: ฟอร์ม */}
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 text-amber-500 lg:hidden dark:text-amber-400">
            <Clapperboard className="h-6 w-6" />
            <span className="font-bold tracking-wide">Hollywood Hub</span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight">เข้าสู่ระบบ</h1>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            ยินดีต้อนรับกลับมา กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
          </p>

          <LoginForm showDemoHint={process.env.NODE_ENV !== "production"} />
        </div>
      </section>
    </main>
  );
}
