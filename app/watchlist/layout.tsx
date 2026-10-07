import type { Metadata } from "next";
import Navbar from "@/components/navbar";

export const metadata: Metadata = {
  title: "รายการโปรด | Hollywood Hub",
  description: "ภาพยนตร์และดาราที่คุณบันทึกไว้",
};

export default function WatchlistLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
