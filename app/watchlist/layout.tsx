import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Navbar from "@/components/navbar";
import { getSession } from "@/lib/session";
import { getI18n } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: `${t.watchlist.metaTitle} | Hollywood Hub`, description: t.watchlist.metaDesc };
}

// อ่าน cookie ทุกครั้ง ห้าม prerender เป็นหน้า static
export const dynamic = "force-dynamic";

export default async function WatchlistLayout({ children }: { children: React.ReactNode }) {
  // รายการโปรดผูกกับบัญชี — ต้องล็อกอินก่อน แล้วพากลับมาหน้านี้หลังเข้าสู่ระบบ
  if (!(await getSession())) redirect("/login?next=/watchlist");

  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
