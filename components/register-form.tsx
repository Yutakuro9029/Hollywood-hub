"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  LogIn,
  Mail,
  ShieldCheck,
  User,
  type LucideIcon,
} from "lucide-react";
import { register, type RegisterState } from "@/app/actions/auth";
import {
  AuthSubmitButton,
  cardClass,
  fieldClass,
  iconClass,
  titleClass,
} from "@/components/auth-ui";

const initialState: RegisterState = {};

function PasswordField({
  id,
  name,
  label,
  placeholder,
  icon: Icon,
}: {
  id: string;
  name: string;
  label: string;
  placeholder: string;
  icon: LucideIcon;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="group relative">
        <Icon className={iconClass} strokeWidth={1.75} />
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete="new-password"
          placeholder={placeholder}
          required
          className={`${fieldClass} pr-12`}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
          className="absolute top-1/2 right-3 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-zinc-400 transition hover:bg-zinc-200/70 hover:text-zinc-700 dark:hover:bg-white/10 dark:hover:text-zinc-100"
        >
          {show ? (
            <EyeOff className="h-[18px] w-[18px]" strokeWidth={1.75} />
          ) : (
            <Eye className="h-[18px] w-[18px]" strokeWidth={1.75} />
          )}
        </button>
      </div>
    </div>
  );
}

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(register, initialState);

  return (
    <div className={cardClass}>
      <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

      <h1 className={titleClass}>สมัครสมาชิก</h1>
      <p className="mt-1.5 text-sm font-light text-zinc-500 dark:text-zinc-400">
        สร้างบัญชีเพื่อเริ่มสำรวจโลกของดาราและภาพยนตร์ฮอลลีวูด
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
              defaultValue={state.values?.username}
              placeholder="อย่างน้อย 3 ตัวอักษร ไม่มีช่องว่าง"
              required
              className={fieldClass}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            อีเมล
          </label>
          <div className="group relative">
            <Mail className={iconClass} strokeWidth={1.75} />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              defaultValue={state.values?.email}
              placeholder="name@example.com"
              required
              className={fieldClass}
            />
          </div>
        </div>

        <PasswordField
          id="password"
          name="password"
          label="รหัสผ่าน"
          placeholder="อย่างน้อย 6 ตัวอักษร"
          icon={Lock}
        />
        <PasswordField
          id="confirmPassword"
          name="confirmPassword"
          label="ยืนยันรหัสผ่าน"
          placeholder="กรอกรหัสผ่านอีกครั้ง"
          icon={ShieldCheck}
        />

        <AuthSubmitButton
          pending={isPending}
          label="สมัครสมาชิก"
          pendingLabel="กำลังสร้างบัญชี..."
        />
      </form>

      <div className="mt-6 flex items-center gap-3 text-xs text-zinc-400">
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
        มีบัญชีอยู่แล้ว?
        <span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />
      </div>

      <Link
        href="/login"
        className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-600/40 text-sm font-medium text-amber-700 transition hover:bg-amber-500/10 dark:border-amber-400/40 dark:text-amber-300"
      >
        <LogIn className="h-4 w-4" strokeWidth={1.75} />
        เข้าสู่ระบบ
      </Link>
    </div>
  );
}
