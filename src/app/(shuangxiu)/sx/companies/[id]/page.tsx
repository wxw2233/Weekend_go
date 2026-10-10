import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import WeekStrip from "@/components/WeekStrip";
import { RestBadge, SourceBadge } from "@/components/StatusBadge";
import CorrectButton from "@/components/CorrectButton";
import CommentsSection from "@/components/CommentsSection";
import AdminDeleteCompany from "@/components/AdminDeleteCompany";
import CompanyVoteBox from "@/components/CompanyVoteBox";
import { getCompany } from "@/lib/store";
import { getCurrentUser } from "@/lib/user-auth-http";
import { companyVoteStat, myCompanyVote } from "@/lib/company-votes";
import { restDaysPerWeek, restLevel } from "@/lib/types";

const cardBorder: Record<string, string> = {
  green: "border-rest bg-rest-soft/25",
  yellow: "border-caution bg-caution-soft/30",
  red: "border-danger bg-danger-soft/35",
  gray: "border-line bg-white",
};

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) {
    return { title: "企业未找到 · 双休go!" };
  }
  const title = `${company.name} · ${company.restType} · 双休go!`;
  const description = `${company.city} ${company.industry}｜休息制度：${company.restType}。一周休满两天即算双休（含轮休）。信息仅供参考。`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CompanyPage({ params }: Props) {
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();
  const user = await getCurrentUser();
  const level = restLevel(company.restType, company.restDays);
  const days = company.restDays?.length ?? restDaysPerWeek(company.restType);

  return (
    <div className="container-page py-8">
      <Link
        href="/sx#directory"
        className="text-sm font-medium text-haze hover:text-rest"
      >
        ← 返回
      </Link>

      <div className={`mt-4 rounded-lg border-2 p-5 sm:p-6 ${cardBorder[level]}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-ink">{company.name}</h1>
              <RestBadge restType={company.restType} />
            </div>
            <p className="mt-1 text-sm text-haze">
              {company.city} · {company.industry}
              {company.position ? ` · ${company.position}` : ""}
            </p>
            <div className="mt-2">
              <SourceBadge source={company.source} />
            </div>
          </div>
          <WeekStrip
            restType={company.restType}
            restDays={company.restDays}
          />
        </div>

        <div className="mt-4 rounded-lg bg-white/85 p-3 text-sm leading-relaxed text-haze">
          {company.restType === "双休"
            ? "判定说明：一周任意休息满 2 天即计为双休（含轮休、调休），不限周六周日。"
            : days === 0
              ? "判定说明：公开信息显示无固定周休。"
              : days > 0
                ? "判定说明：按每周大约休息天数归类，具体以岗位实际制度为准。"
                : "判定说明：休息天数暂无足够依据，待核实。"}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg bg-white/80 p-4">
            <p className="text-xs font-semibold text-haze">说明</p>
            <p className="mt-1 text-sm text-ink">{company.note || "—"}</p>
          </div>
          <div className="rounded-lg bg-white/80 p-4">
            <p className="text-xs font-semibold text-haze">依据</p>
            <p className="mt-1 text-sm text-ink">{company.evidenceHint || "—"}</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-haze">更新 {company.updatedAt}</p>
      </div>

      <p className="mt-3 text-xs leading-relaxed text-haze">
        以上为信息参考，不构成法律评价；请以劳动合同与实际制度为准。
      </p>

      <CompanyVoteBox
        companyId={company.id}
        initialStat={companyVoteStat(company.id)}
        initialMyVote={user ? myCompanyVote(`u:${user.id}`, company.id) : null}
        isLoggedIn={Boolean(user)}
        backHref={`/sx/companies/${company.id}`}
      />

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <CorrectButton
          companyId={company.id}
          companyName={company.name}
          defaultRestType={company.restType}
          isLoggedIn={Boolean(user)}
        />
        <AdminDeleteCompany
          companyId={company.id}
          companyName={company.name}
        />
      </div>

      <CommentsSection companyId={company.id} />
    </div>
  );
}
