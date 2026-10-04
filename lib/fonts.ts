import { Noto_Serif_Thai, Prompt } from "next/font/google";

export const fontSans = Prompt({
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-sans-th",
  display: "swap",
});

export const fontSerif = Noto_Serif_Thai({
  subsets: ["thai", "latin"],
  variable: "--font-serif-th",
  display: "swap",
});
