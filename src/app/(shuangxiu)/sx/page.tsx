import { Suspense } from "react";
import Link from "next/link";
import FilterBar from "@/components/FilterBar";
import CompanyList from "@/components/CompanyList";
import HeroBand from "@/components/HeroBand";
import { filterCompanies, listCompanies, uniqueValues } from "@/lib/store";
import { companyVoteStatsMap } from "@/lib/company-votes";
import { commentCountsByCompany } from "@/lib/db";
import { REST_TYPES, isDualRest } from "@/lib/types";

type SearchParams = Promise<{
  q?: string;
  rest?: string;
  city?: string;
  sort?: string;
}>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const all = await listCompanies();
  const filtered = filterCompanies(all, {
    q: params.q,
    rest: params.rest,
    city: params.city,
  });
  const cities = uniqueValues(all, "city");
  const dual = all.filter((c) => isDualRest(c.restType, c.restDays)).length;

  const voteMap = companyVoteStatsMap(filtered.map((c) => c.id));
  const votes = Object.fromEntries(voteMap);
  const commentCounts = commentCountsByCompany(filtered.map((c) => c.id));

  if (params.sort === "comments") {
    filtered.sort(
      (a, b) => (commentCounts[b.id] ?? 0) - (commentCounts[a.id] ?? 0),
    );
  } else if (params.sort === "trust") {
    const trust = (id: string) => {
      const s = voteMap.get(id);
      const total = (s?.real ?? 0) + (s?.fake ?? 0);
      return total > 0 ? s!.real / total : -1;
    };
    filtered.sort((a, b) => trust(b.id) - trust(a.id));
  }

  return (
    <>
      <HeroBand dual={dual} total={all.length} />

      <section id="directory" className="scroll-mt-16">
        <div className="container-page py-6 sm:py-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">企业库</h2>
            <p className="text-sm text-haze">
              {filtered.length} / {all.length}
            </p>
          </div>

          <div className="mt-3 sm:mt-4">
            <Suspense fallback={<p className="text-sm text-haze">加载中…</p>}>
              <FilterBar cities={cities} restTypes={REST_TYPES} />
            </Suspense>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-5 rounded-lg border border-dashed border-line bg-white px-4 py-10 text-center">
              <p className="font-medium text-ink">没有匹配的企业</p>
              <Link href="/sx/submit" className="btn-primary mt-4">
                提交一家
              </Link>
            </div>
          ) : (
            <CompanyList companies={filtered} votes={votes} />
          )}

          <p className="mt-6 text-xs leading-relaxed text-haze">
            本站仅作信息参考，不构成对企业用工合规性的法律评价。休息制度可能因岗位、地区、时期不同，请以劳动合同与实际制度为准。
          </p>
        </div>
      </section>
    </>
  );
}
