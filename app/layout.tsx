import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { bodoni, cinzel, fontSans, fontSerif } from "@/lib/fonts";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { getWatchlist } from "@/lib/watchlist";
import { WatchlistProvider } from "@/lib/use-favorites";
import { getI18n } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/client";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: "Hollywood Stars & Filmography Hub", description: t.footer.tagline };
}

/** ผู้ใช้ที่ล็อกอินอยู่ (ตรวจซ้ำกับ DB เผื่อบัญชีถูกลบหลังออก cookie) พร้อมรายการโปรดของเขา */
async function getViewerWatchlist() {
  const session = await getSession();
  const user = session
    ? await prisma.users.findUnique({ where: { id: session.userId }, select: { id: true } })
    : null;
  return user
    ? { userId: user.id, data: await getWatchlist(user.id) }
    : { userId: null, data: { movies: [], actors: [] } };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [viewer, { locale }] = await Promise.all([getViewerWatchlist(), getI18n()]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${cinzel.variable} ${bodoni.variable} ${fontSerif.variable} ${fontSans.variable} min-h-screen bg-ink font-sans text-cream antialiased`}
      >
        <ThemeProvider
          attribute="class"
          forcedTheme="dark"
          disableTransitionOnChange
        >
          {/* key: ล็อกอิน/ออกจากระบบ/สลับบัญชี → เริ่ม state ใหม่จากข้อมูลของบัญชีนั้น */}
          <LocaleProvider locale={locale}>
            <WatchlistProvider
              key={viewer.userId ?? "guest"}
              loggedIn={viewer.userId !== null}
              initial={viewer.data}
            >
              {children}
            </WatchlistProvider>
          </LocaleProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
