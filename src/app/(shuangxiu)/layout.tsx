import Link from "next/link";
import type { ReactNode } from "react";

export default function ShuangxiuLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-line bg-white">
        <div className="container-page flex min-h-9 items-center gap-2 text-xs text-haze">
          <Link href="/" className="hover:text-rest">
            门户
          </Link>
          <span aria-hidden>/</span>
          <span className="font-semibold text-ink">双休go! · 企业休息制度目录</span>
        </div>
      </div>
      {children}
    </>
  );
}
