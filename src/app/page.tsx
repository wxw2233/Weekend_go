import Link from "next/link";
import type { Metadata } from "next";

type Section = {
  title: string;
  desc: string;
  href?: string;
  status: "live" | "soon";
  tag: string;
};

const SECTIONS: Section[] = [
  {
    title: "双休go!",
    desc: "企业休息制度信息目录：搜索企业是否双休、一周休哪几天，用户标注 + 企业认领 + 真实讨论。",
    href: "/sx",
    status: "live",
    tag: "企业休息制度",
  },
  {
    title: "职场内容",
    desc: "职场观察、劳动法规解读与休息制度动态，图文内容板块。",
    status: "soon",
    tag: "文章 · 筹备中",
  },
  {
    title: "实用工具",
    desc: "加班计算、休息日查询等小工具，正在规划。",
    status: "soon",
    tag: "工具 · 规划中",
  },
];

export const metadata: Metadata = {
  title: "双休go! 站点门户 · 全部板块",
  description:
    "「双休go!」站点门户：企业休息制度目录、职场内容与实用工具，多板块统一导航。",
};

export default function PortalPage() {
  return (
    <>
      <section className="border-b border-line bg-rest-deep">
        <div className="container-page py-14 sm:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rest-soft">
            Shuangxiu Go! Portal
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            双休go! 站点门户
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-rest-soft">
            这是一个多板块站点：以企业休息制度目录「双休go!」为起点，逐步聚合职场内容与实用工具。
            先问休不休，再决定买不买。
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href="/sx"
              className="inline-flex min-h-11 items-center rounded-md bg-white px-5 text-sm font-bold text-rest-deep transition hover:bg-rest-soft"
            >
              进入双休go! →
            </Link>
            <Link
              href="#sections"
              className="inline-flex min-h-11 items-center rounded-md border border-white/40 px-5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              浏览全部板块
            </Link>
          </div>
          <p className="mt-6 text-xs font-medium text-rest-soft">
            当前 1 个板块已上线 · 2 个板块筹备中
          </p>
        </div>
      </section>
      <section id="sections" className="container-page py-10 sm:py-12">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-xl font-bold text-ink">板块导航</h2>
          <span className="text-sm text-haze">更多板块陆续上线</span>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((s) => {
            const live = s.status === "live";
            const inner = (
              <>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-rest">
                    {s.tag}
                  </span>
                  {live ? (
                    <span className="rounded-full bg-rest px-2 py-0.5 text-xs font-semibold text-white">
                      已上线
                    </span>
                  ) : (
                    <span className="rounded-full border border-line px-2 py-0.5 text-xs text-haze">
                      敬请期待
                    </span>
                  )}
                </div>
                <h3 className="mt-3 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-haze">{s.desc}</p>
                <span
                  className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold ${
                    live ? "text-rest" : "text-haze"
                  }`}
                >
                  {live ? "进入板块 →" : "敬请期待"}
                </span>
              </>
            );
            return live ? (
              <Link
                key={s.title}
                href={s.href!}
                className="flex min-h-48 flex-col rounded-lg border-2 border-rest bg-white p-5 shadow-rest transition hover:-translate-y-0.5 hover:shadow-lift"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={s.title}
                className="flex min-h-48 flex-col rounded-lg border border-dashed border-line bg-paper p-5 opacity-70"
              >
                {inner}
              </div>
            );
          })}
        </div>
      </section>
      <section className="container-page pb-12">
        <div className="rounded-lg border border-line bg-white p-5 text-sm leading-6 text-haze">
          <p className="font-semibold text-ink">关于本站</p>
          <p className="mt-2">
            「双休go!」从企业休息制度目录出发，逐步扩展为职场休息主题的内容与工具门户。
            判定标准不变：一周任意休息满 2 天（含轮休）即计为双休，不限周六周日。
          </p>
        </div>
      </section>
    </>
  );
}
