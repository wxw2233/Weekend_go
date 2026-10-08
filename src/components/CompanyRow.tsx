import Link from "next/link";
import type { Company } from "@/lib/types";
import { restLevel } from "@/lib/types";
import { RestBadge, SourceBadge } from "@/components/StatusBadge";
import WeekStrip from "@/components/WeekStrip";

const cardBorder: Record<string, string> = {
  green: "border-rest bg-rest-soft/25",
  yellow: "border-caution bg-caution-soft/30",
  red: "border-danger bg-danger-soft/35",
  gray: "border-line bg-white",
};

export default function CompanyRow({ company }: { company: Company }) {
  const level = restLevel(company.restType, company.restDays);

  return (
    <Link
      href={`/sx/companies/${company.id}`}
      className={`group block rounded-lg border-2 p-3.5 transition active:scale-[0.99] sm:p-4 ${cardBorder[level]}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold text-ink group-hover:text-rest">
            {company.name}
          </h3>
          <p className="mt-1 text-sm text-haze">
            {company.city} · {company.industry}
            {company.position ? ` · ${company.position}` : ""}
          </p>
        </div>
        <RestBadge restType={company.restType} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <WeekStrip
          restType={company.restType}
          restDays={company.restDays}
          compact
        />
        <SourceBadge source={company.source} />
      </div>
    </Link>
  );
}
