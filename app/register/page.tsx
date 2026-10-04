import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clapperboard } from "lucide-react";
import { getSession } from "@/lib/session";
import { fontSans, fontSerif } from "@/lib/fonts";
import { LoginBackdrop } from "@/components/login-backdrop";
import { RegisterForm } from "@/components/register-form";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "สมัครสมาชิก | Hollywood Stars & Filmography Hub",
};

export default async function RegisterPage() {
  // ล็อกอินอยู่แล้ว ไม่ต้องสมัครซ้ำ
  const session = await getSession();
  if (session) redirect(session.role === "ADMIN" ? "/admin" : "/");

  return (
    <main
      className={`${fontSans.variable} ${fontSerif.variable} relative isolate flex min-h-screen flex-col overflow-hidden bg-[#05060a] font-[family-name:var(--font-sans-th)] text-white`}
    >
      <LoginBackdrop />

      <header className="flex items-center justify-between px-6 pt-6 sm:px-10 sm:pt-8">
        <Link href="/" className="flex items-center gap-2.5 text-amber-400">
          <Clapperboard className="h-7 w-7" strokeWidth={1.75} />
          <span className="text-lg font-semibold tracking-[0.12em] uppercase">
            Hollywood Hub
          </span>
        </Link>
        <ThemeToggle />
      </header>

      <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <RegisterForm />
        </div>
      </div>

      <footer className="px-6 pb-6 text-center text-xs font-light tracking-wide text-white/50">
        © {new Date().getFullYear()} Hollywood Stars &amp; Filmography Hub
      </footer>
    </main>
  );
}
