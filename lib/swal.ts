"use client";

import Swal from "sweetalert2";

/*
 * SweetAlert2 โทนดำ–ทองของเว็บ ใช้ยืนยันทุกการเพิ่ม/แก้ไข/ลบข้อมูลในหลังบ้าน
 * (sweetalert2 ฉีด CSS พื้นฐานเอง ส่วนสีและปุ่มกำหนดผ่าน customClass ด้วย Tailwind)
 */
const baseClass = {
  popup: "!rounded-[4px] !border !border-line !bg-surface !text-cream",
  title: "!font-editorial !text-2xl !font-normal !text-cream",
  htmlContainer: "!text-sm !leading-relaxed !text-cream/75",
  actions: "!gap-3",
  confirmButton:
    "inline-flex items-center justify-center rounded-[4px] bg-gold-gradient px-5 py-2.5 text-sm font-medium text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light",
  cancelButton:
    "inline-flex items-center justify-center rounded-[4px] border border-line px-5 py-2.5 text-sm text-cream/80 hover:border-gold-dark hover:text-gold-light focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-light",
  timerProgressBar: "!bg-gold",
};

const themed = Swal.mixin({
  buttonsStyling: false,
  reverseButtons: true,
  customClass: baseClass,
});

const dangerButton =
  "inline-flex items-center justify-center rounded-[4px] bg-red-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300";

/** ถามยืนยันก่อนทำรายการ — คืน true เมื่อกดยืนยัน */
export async function confirmAction({
  title,
  text,
  confirmText,
  cancelText,
  danger = false,
}: {
  title: string;
  text?: string;
  confirmText: string;
  cancelText: string;
  /** การลบ: ไอคอนเตือน + ปุ่มแดง */
  danger?: boolean;
}): Promise<boolean> {
  const result = await themed.fire({
    title,
    text,
    icon: danger ? "warning" : "question",
    iconColor: danger ? "#f87171" : "#D4AF37",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    ...(danger && {
      // customClass ทับทั้งก้อน ต้องรวมของเดิมไว้ด้วย
      customClass: { ...baseClass, confirmButton: dangerButton },
    }),
  });
  return result.isConfirmed;
}

/** แจ้งว่าทำสำเร็จ (ปิดเองใน 1.8 วินาที) */
export function alertSuccess(title: string, text?: string) {
  return themed.fire({
    title,
    text,
    icon: "success",
    iconColor: "#D4AF37",
    timer: 1800,
    timerProgressBar: true,
    showConfirmButton: false,
  });
}

/** แจ้งข้อผิดพลาดจากเซิร์ฟเวอร์ */
export function alertError(text: string, { title, ok }: { title: string; ok: string }) {
  return themed.fire({
    title,
    text,
    icon: "error",
    iconColor: "#f87171",
    confirmButtonText: ok,
  });
}

export const isAlertOpen = () => Swal.isVisible();
