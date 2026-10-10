import type { CompanyVoteStat } from "@/lib/company-votes";

type Props = {
  stat: CompanyVoteStat;
  /** sm = 列表卡片内，lg = 详情页 */
  size?: "sm" | "lg";
};

/**
 * 真/假双休对赌进度条：左绿=真，右红=假，
 * 中间白色分界线，票多的一侧占更长。
 */
export default function VoteBar({ stat, size = "sm" }: Props) {
  const total = stat.real + stat.fake;
  const realPct = total > 0 ? Math.round((stat.real / total) * 100) : 0;
  const fakePct = 100 - realPct;
  const hasVotes = total > 0;
  const barH = size === "lg" ? "h-3.5" : "h-2.5";
  const dividerW = size === "lg" ? "w-[3px]" : "w-[2px]";

  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-[11px] leading-none">
        <span className={`font-bold text-rest ${size === "lg" ? "text-sm" : ""}`}>
          真 {stat.real}
        </span>
        <span className="font-medium tabular-nums text-haze">
          {hasVotes ? (
            <>
              <span className="text-rest">{realPct}%</span>
              <span className="mx-1 text-line">|</span>
              <span className="text-danger">{fakePct}%</span>
            </>
          ) : (
            "暂无投票"
          )}
        </span>
        <span className={`font-bold text-danger ${size === "lg" ? "text-sm" : ""}`}>
          假 {stat.fake}
        </span>
      </div>

      <div
        className={`relative mt-1.5 flex ${barH} overflow-hidden rounded-full ${
          hasVotes ? "bg-line/40" : "bg-line/30"
        }`}
        role="img"
        aria-label={`真 ${stat.real} 票，假 ${stat.fake} 票`}
      >
        {hasVotes ? (
          <>
            <div
              className="h-full bg-rest transition-all duration-500 ease-out"
              style={{ width: `${realPct}%` }}
            />
            <div className={`h-full shrink-0 ${dividerW} bg-white shadow-[0_0_0_1px_rgba(15,26,20,0.08)]`} />
            <div
              className="h-full flex-1 bg-danger transition-all duration-500 ease-out"
              style={{ width: `${fakePct}%` }}
            />
          </>
        ) : (
          <div className="h-full flex-1 bg-line/30" />
        )}
      </div>
    </div>
  );
}
