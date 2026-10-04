import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Clapperboard, Search, Star } from "lucide-react";
import { getSession } from "@/lib/session";
import { fontSans, fontSerif } from "@/lib/fonts";
import { LoginBackdrop } from "@/components/login-backdrop";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "เข้าสู่ระบบ | Hollywood Stars & Filmography Hub",
};

export default async function LoginPage() {
  // ถ้าล็อกอินอยู่แล้ว ไม่ต้องเห็นหน้า login
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/");

  return (
    <main
      className={`${fontSans.variable} ${fontSerif.variable} relative isolate flex min-h-screen flex-col overflow-hidden bg-[#05060a] font-[family-name:var(--font-sans-th)] text-white`}
    >
      <LoginBackdrop />

      {/* โลโก้มุมซ้ายบน + ปุ่มกลับหน้าแรก */}
      <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <div className="flex items-center gap-2.5 text-amber-400">
          <Clapperboard className="h-7 w-7" strokeWidth={1.75} />
          <span className="text-lg font-semibold tracking-[0.12em] uppercase">
            Hollywood Hub
          </span>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition hover:bg-white/20 hover:text-amber-300 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
          กลับหน้าแรก
        </Link>
      </header>

      <div className="flex flex-1 items-center px-6 py-10 sm:px-10">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_minmax(0,28rem)] lg:gap-16">
          {/* ฝั่งซ้าย: หัวข้อ + ดาว + ช่องค้นหา */}
          <section className="space-y-6">
            <h2 className="text-4xl leading-[1.15] tracking-tight sm:text-5xl lg:text-6xl">
              <span className="block font-semibold">ศูนย์รวมข้อมูล</span>
              <span className="block font-light text-white/90">
                ดาราและภาพยนตร์ฮอลลีวูด
              </span>
            </h2>

            <div className="flex gap-1.5 text-amber-400" aria-label="5 ดาว">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-current drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                />
              ))}
            </div>

            <p className="hidden max-w-md text-base leading-relaxed font-light text-zinc-300 sm:block">
              ค้นหาดาราที่คุณชื่นชอบ สำรวจผลงานภาพยนตร์
              และติดตามรางวัลระดับโลกได้ในที่เดียว
            </p>

            {/* ช่องค้นหาแบบตกแต่ง (ยังไม่ใช่ฟอร์มจริง) */}
            <div
              aria-hidden
              className="hidden max-w-md items-center gap-3 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-light text-white/70 backdrop-blur-md sm:flex"
            >
              <Search className="h-4 w-4 text-amber-300" />
              <span>ค้นหาดารา เช่น Cillian Murphy, Zendaya…</span>
            </div>
          </section>

          {/* ฝั่งขวา: การ์ดเข้าสู่ระบบ (จุดโฟกัส) */}
          <div className="w-full max-w-md justify-self-center lg:justify-self-end">
            <LoginForm showDemoHint={process.env.NODE_ENV !== "production"} />
          </div>
        </div>
      </div>

      <footer className="px-6 pb-6 text-center text-xs font-light tracking-wide text-white/50">
        © {new Date().getFullYear()} Hollywood Stars &amp; Filmography Hub
      </footer>
    </main>
  );
}
