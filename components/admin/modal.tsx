"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { isAlertOpen } from "@/lib/swal";
import { useI18n } from "@/lib/i18n/client";

export default function Modal({
  title, onClose, children,
}: { title: string; onClose: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  useEffect(() => {
    // Esc ขณะกล่องยืนยัน (SweetAlert) เปิดอยู่ = ปิดแค่กล่องยืนยัน ไม่ปิดฟอร์มทิ้ง
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !isAlertOpen() && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="my-8 w-full max-w-xl rounded-2xl border border-zinc-800 bg-white shadow-2xl dark:bg-surface">
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100" aria-label={t.admin.crud.close}>
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
