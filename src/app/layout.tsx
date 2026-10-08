import type { Metadata, Viewport } from "next";
import Link from "next/link";
import AuthNav from "@/components/AuthNav";
import BindEmailBanner from "@/components/BindEmailBanner";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "双休go! · 查企业休不休",
  description: "企业休息信息参考目录：一周休满两天即算双休（含轮休）。",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-body antialiased">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur">
          <div className="container-page flex min-h-14 items-center justify-between gap-2">
            <Link
              href="/"
              className="shrink-0 text-lg font-bold tracking-tight text-ink hover:text-rest"
            >
              双休go!
            </Link>

            <nav className="hidden items-center gap-1 text-sm md:flex">
              <Link
                href="/#directory"
                className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
              >
                企业库
              </Link>
              <Link
                href="/claim"
                className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
              >
                企业认领
              </Link>
              <Link
                href="/submit"
                className="min-h-10 px-2.5 py-2 font-medium text-ink hover:text-rest"
              >
                提交标注
              </Link>
              <AuthNav />
            </nav>

            <div className="md:hidden">
              <MobileNav />
            </div>
          </div>
        </header>
        <BindEmailBanner />
        <main className="pb-[env(safe-area-inset-bottom)]">{children}</main>
        <footer className="border-t border-line bg-paper">
          <div className="container-page py-6 text-sm text-haze">
            双休go! · 信息参考目录 · 以劳动合同与实际制度为准
          </div>
        </footer>
      </body>
    </html>
  );
}
