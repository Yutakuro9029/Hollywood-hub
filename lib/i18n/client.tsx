"use client";

import { createContext, useContext } from "react";
import { DEFAULT_LOCALE, type Locale } from "./config";
import { getDict } from "./dictionaries";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

/** ส่งภาษาจาก root layout ลงไปให้ Client Component (ข้อความมีฟังก์ชัน จึงส่งแค่ชื่อภาษาแล้วเลือก dict ฝั่ง client) */
export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const locale = useContext(LocaleContext);
  return { locale, t: getDict(locale) };
}
