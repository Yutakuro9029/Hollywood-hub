"use client";

import { useActionState, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

const inputClass =
  "w-full rounded-lg border border-zinc-300 bg-white py-2.5 pr-3 pl-10 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 transition focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 " +
  "focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500";

export function LoginForm({ showDemoHint = false }: { showDemoHint?: boolean }) {
  const [state, formAction, isPending] = useActionState(login, initialState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="mt-8 space-y-5" noValidate>
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-600 dark:text-red-400"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-sm font-medium">
          ชื่อผู้ใช้
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            defaultValue={state.username}
            placeholder="username"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className="text-sm font-medium">
          รหัสผ่าน
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className={`${inputClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 focus:ring-2 focus:ring-amber-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        {isPending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
      </button>

      {showDemoHint && (
        <div className="rounded-lg border border-dashed border-zinc-300 p-3 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <p className="mb-1 font-semibold">บัญชีทดสอบ (แสดงเฉพาะโหมดพัฒนา)</p>
          <p>
            Admin: <code>admin</code> / <code>admin123</code>
          </p>
          <p>
            User: <code>user1</code> / <code>user123</code>
          </p>
        </div>
      )}
    </form>
  );
}
