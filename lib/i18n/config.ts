/** ภาษาที่เว็บรองรับ — ใช้ได้ทั้งฝั่ง Server และ Client */
export const LOCALES = ["th", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "th";
export const LOCALE_COOKIE = "lang";

export const isLocale = (v: unknown): v is Locale => typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** แท็กภาษาสำหรับ Intl (วันที่ ชื่อภาษา) */
export const intlTag = (locale: Locale) => (locale === "th" ? "th-TH" : "en-US");
