import Link from "next/link";
import type { ReactNode } from "react";

export default function HolidayLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="border-b border-line bg-rest-soft/60">
        <div className="container-page flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 py-1.5 text-sm">
          <Link
            href="/"
            className="inline-flex min-h-8 items-center rounded-md bg-white px-2.5 py-1 font-semibold text-rest shadow-rest ring-1 ring-rest/30 transition hover:bg-rest hover:text-white"
          >
            ← 门户首页
          </Link>
          <span className="text-haze">
            当前板块：<span className="font-semibold text-ink">休息日历 · 假期与调休</span>
          </span>
        </div>
      </div>
      {children}
    </>
  );
}
