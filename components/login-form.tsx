"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Lock,
  User,
  UserPlus,
} from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

const fieldClass =
  "h-12 w-full rounded-xl border border-zinc-300 bg-white pr-4 pl-11 text-[15px] text-zinc-900 shadow-sm " +
  "placeholder:text-zinc-400 transition focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 focus:outline-none " +
  "dark:border-white/10 dark:bg-zinc-950/60 dark:text-zinc-100 dark:shadow-none dark:placeholder:text-zinc-500 dark:focus:border-amber-400";

const iconClass =
  "pointer-events-none absolute top-1/2 left-4 h-[18px] w-[18px] -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-amber-500";

export function LoginForm({ showDemoHint = false }: { showDemoHint?: boolean }) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-zinc-200/80 bg-zinc-50/95 p-7 text-zinc-900 shadow-2xl shadow-black/50 sm:p-9 dark:border-white/10 dark:bg-zinc-900/80 dark:text-zinc-100 dark:backdrop-blur-xl">
      {/* เส้นทองด้านบนการ์ด */}
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

      <h1 className="font-[family-name:var(--font-serif-th)] text-3xl font-bold text-amber-700 dark:bg-gradient-to-r dark:from-amber-200 dark:via-amber-400 dark:to-amber-500 dark:bg-clip-text dark:text-transparent">
        เข้าสู่ระบบ
      </h1>
      <p className="mt-1.5 text-sm font-light text-zinc-500 dark:text-zinc-400">
        ยินดีต้อนรับกลับมา กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ
      </p>

      <form action={formAction} className="mt-7 space-y-5" noValidate>
        {state.error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="username" className="text-sm font-medium">
            ชื่อผู้ใช้
          </label>
          <div className="group relative">
            <User className={iconClass} strokeWidth={1.75} />
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              defaultValue={state.username}
              placeholder="กรอกชื่อผู้ใช้"
              required
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium">
            รหัสผ่าน
          </label>
          <div className="group relative">
            <Lock className={iconClass} strokeWidth={1.75} />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="กรอกรหัสผ่าน"
              required
              className={`${fieldClass} pr-12`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
              ) : (
                <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex cursor-pointer items-center gap-2 select-none">
            <input
              type="checkbox"
              name="remember"
              defaultChecked={state.remember}
              className="h-4 w-4 rounded border-zinc-300 accent-amber-500"
            />
            <span className="text-zinc-600 dark:text-zinc-300">จดจำฉัน</span>
          </label>
          <button
            type="button"
            onClick={() => setShowForgot((v) => !v)}
            aria-expanded={showForgot}
            className="font-medium text-amber-700 transition hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300"
          >
            ลืมรหัสผ่าน?
          </button>
        </div>

        {showForgot && (
          <div
            role="status"
            className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200"
          >
            <Info className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              ระบบนี้ยังไม่รองรับการรีเซ็ตรหัสผ่านอัตโนมัติ
              กรุณาติดต่อผู้ดูแลระบบเพื่อขอรหัสผ่านใหม่
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl border border-amber-200/70 bg-gradient-to-b from-amber-300 via-amber-400 to-amber-600 text-[15px] font-semibold tracking-wide text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.55),inset_0_-2px_0_rgba(120,53,15,0.35),0_10px_24px_-8px_rgba(245,158,11,0.65)] transition hover:brightness-105 focus-visible:ring-4 focus-visible:ring-amber-500/40 focus-visible:outline-none active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* พื้นผิวลายเส้นละเอียด + แสงวิ่งผ่านตอน hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(135deg,rgba(255,255,255,0.10)_0_2px,transparent_2px_5px)] mix-blend-overlay"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/30 blur-sm transition-transform duration-700 group-hover:translate-x-[420%]"
          />
          <span className="relative flex items-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </span>
        </button>

        {showDemoHint && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-100/70 px-4 py-3 text-xs text-zinc-500 dark:border-white/10 dark:bg-white/5 dark:text-zinc-400">
            <p className="mb-1 font-medium text-zinc-600 dark:text-zinc-300">
              บัญชีทดสอบ
            </p>
            <p>
              Admin: <code className="font-mono">admin</code> /{" "}
              <code className="font-mono">admin123</code>
            </p>
            <p>
              User: <code className="font-mono">user1</code> /{" "}
              <code className="font-mono">user123</code>
            </p>
          </div>
        )}
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
        ยังไม่มีบัญชี?
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
      </div>

      <Link
        href="/register"
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-600/40 text-sm font-medium text-amber-700 transition hover:bg-amber-500/10 dark:border-amber-400/40 dark:text-amber-300"
      >
        <UserPlus className="h-4 w-4" strokeWidth={1.75} />
        ลงทะเบียน
      </Link>
    </div>
  );
}
