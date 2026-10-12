"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setLocale } from "@/app/actions/locale";
import { LOCALES } from "@/lib/i18n/config";
import { useI18n } from "@/lib/i18n/client";

const LABEL = { th: "TH", en: "EN" } as const;

/** ปุ่มสลับภาษา TH | EN — บันทึกลง cookie แล้ว refresh ข้อมูลหน้าเดิม (ไม่เปลี่ยน URL) */
export default function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t.common.language} className={`flex items-center text-xs ${pending ? "opacity-60" : ""} ${className}`}>
      {LOCALES.map((l, i) => (
        <span key={l} className="flex items-center">
          {i > 0 && <span aria-hidden className="px-1.5 text-line">|</span>}
          <button
            type="button"
            lang={l}
            disabled={pending || l === locale}
            aria-pressed={l === locale}
            onClick={() =>
              startTransition(async () => {
                await setLocale(l);
                router.refresh();
              })
            }
            className={`rounded-sm px-0.5 py-1 tracking-wider transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light ${
              l === locale ? "text-gold-light" : "text-cream/60 hover:text-cream"
            }`}
          >
            {LABEL[l]}
          </button>
        </span>
      ))}
    </div>
  );
}
