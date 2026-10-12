import type { Locale } from "./config";
import { th, type Dict } from "./th";
import { en } from "./en";

export type { Dict };

const DICTS: Record<Locale, Dict> = { th, en };

/** ข้อความของภาษาที่เลือก (ใช้ได้ทั้ง Server และ Client) */
export const getDict = (locale: Locale): Dict => DICTS[locale];
