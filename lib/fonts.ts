import { Bodoni_Moda, Cinzel, IBM_Plex_Sans_Thai, Noto_Serif_Thai } from "next/font/google";

/** ฟอนต์เนื้อหา (ไทย + อังกฤษ) */
export const fontSans = IBM_Plex_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans-th",
  display: "swap",
});

/** ฟอนต์ serif ภาษาไทย — หัวข้อภาษาไทย (จับคู่กับ Cinzel ผ่านคลาส font-display) */
export const fontSerif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-serif-th",
  display: "swap",
});

/**
 * ฟอนต์หัวข้อตัวอักษรละติน (Cinzel — แบบตัวอักษรสลักบนป้ายโรงละคร)
 * ใช้กับโลโก้ ชื่อหนัง และตัวเลข Top 10 · เบราว์เซอร์สลับไป Noto Serif Thai เองเมื่อเจออักษรไทย
 */
export const cinzel = Cinzel({
  subsets: ["latin"],
  variable: "--font-cinzel",
  display: "swap",
});

/**
 * ฟอนต์หัวข้อแบบนิตยสาร (Bodoni Moda) — ใช้กับหน้าแรกแบบ "ทำเนียบดารา" ผ่านคลาส font-editorial
 * อักษรไทยสลับไป Noto Serif Thai อัตโนมัติ
 */
export const bodoni = Bodoni_Moda({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-bodoni",
  display: "swap",
});
