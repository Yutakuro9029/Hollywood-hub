import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "./config";
import { getDict } from "./dictionaries";

/** ภาษาที่ผู้ชมเลือก (เก็บใน cookie "lang") ไม่มี = ภาษาไทย */
export async function getLocale(): Promise<Locale> {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** ภาษา + ข้อความของภาษานั้น สำหรับ Server Component / Server Action */
export async function getI18n() {
  const locale = await getLocale();
  return { locale, t: getDict(locale) };
}
