import { Noto_Serif_Thai, Playfair_Display, Prompt } from "next/font/google";

/** ฟอนต์เนื้อหา (ไทย + อังกฤษ) — ใช้ร่วมกับหน้า /login เดิม */
export const fontSans = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans-th",
  display: "swap",
});

/** ฟอนต์ serif ภาษาไทย — ใช้ร่วมกับหน้า /login เดิม และเป็นฟอนต์หัวข้อภาษาไทยของหน้าแรก */
export const fontSerif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-serif-th",
  display: "swap",
});

/**
 * ฟอนต์หัวข้อตัวอักษรละติน (Playfair Display)
 * จับคู่กับ fontSerif ผ่านคลาส font-display: เบราว์เซอร์เลือกฟอนต์ตามตัวอักษรแต่ละตัวเอง
 */
export const playfair = Playfair_Display({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
  display: "swap",
});
