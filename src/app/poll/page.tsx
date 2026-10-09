import type { Metadata } from "next";
import PollBoard from "@/components/PollBoard";
import { getPollStats } from "@/lib/poll";
import { getCurrentUser } from "@/lib/user-auth-http";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "数据投票 · 你的真实上班状态",
  description:
    "匿名投出你的每日工作时长、薪资挡位和每周休息天数，实时查看大家真实的工作状态分布。",
};

export default async function PollPage() {
  const initialStats = getPollStats();
  const user = await getCurrentUser();

  return (
    <>
      <section className="border-b border-line bg-rest-deep">
        <div className="container-page py-12 sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rest-soft">
            Community Poll
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-white sm:text-4xl">
            数据投票 · 你的真实上班状态
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-rest-soft sm:text-base">
            每天干几个小时？挣多少？一周休几天？登录后三个问题各投一票，
            实时看看大家真实的职场状态。不登录也可以随便看图表。
          </p>
        </div>
      </section>

      <section className="container-page py-10 sm:py-12">
        <PollBoard initialStats={initialStats} isLoggedIn={Boolean(user)} />
      </section>
    </>
  );
}
